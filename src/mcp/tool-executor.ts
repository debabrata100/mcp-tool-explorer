import type { Client } from "@modelcontextprotocol/client";
import { config } from "../config/index.js";
import type { ToolCallOutput, ToolCallRequest } from "../types/tools.js";
import { logger } from "../utils/logger.js";
import { requireApproval } from "../security/approval.js";

/** Validate model-suggested arguments before forwarding them to MCP. */
export class McpToolExecutor {
  constructor(
    private readonly client: Client,
    private readonly toolNames: ReadonlySet<string>,
  ) {}

  async execute(call: ToolCallRequest): Promise<ToolCallOutput> {
    let output: string;
    try {
      if (!this.toolNames.has(call.name)) {
        throw new Error(`Tool not permitted: ${call.name}`);
      }

      const parsed: unknown = JSON.parse(call.arguments);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Tool arguments must be a JSON object");
      }
      const args = parsed as Record<string, unknown>;

      if (call.name === "browser_navigate") {
        const url = args.url;
        if (typeof url !== "string" || new URL(url).origin !== config.allowedOrigin) {
          throw new Error("Navigation outside demo.playwright.dev is not allowed");
        }
      }

      await requireApproval(call.name, args);

      logger.info(`Executing ${call.name}`, args);
      const result = await this.client.callTool({
        name: call.name,
        arguments: args,
      });

      // Trim content blocks BEFORE serialization, so the returned JSON stays valid.
      const raw = JSON.stringify({
        isError: result.isError ?? false,
        content: result.content,
        structuredContent: result.structuredContent,
      });
      output = raw.length <= config.maxToolResultChars
        ? raw
        : JSON.stringify({
            truncated: true,
            text: raw.slice(0, config.maxToolResultChars),
          });
    } catch (error) {
      output = JSON.stringify({
        isError: true,
        message: error instanceof Error ? error.message : String(error),
      });
      logger.warn(`Tool ${call.name} failed`, output);
    }

    return {
      type: "function_call_output",
      call_id: call.call_id,
      output,
    };
  }
}
