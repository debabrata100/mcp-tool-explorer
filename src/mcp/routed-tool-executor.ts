import { isAbsolute, relative, resolve, sep } from "node:path";
import { config } from "../config/index.js";
import { requireApproval } from "../security/approval.js";
import type { ToolCallOutput, ToolCallRequest } from "../types/tools.js";
import { logger } from "../utils/logger.js";
import { McpRegistry } from "./registry.js";

function insideWorkspace(path: string): boolean {
  const target = resolve(path);
  const rel = relative(config.workspace, target);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

export class RoutedToolExecutor {
  constructor(private readonly registry: McpRegistry) {}

  async execute(call: ToolCallRequest): Promise<ToolCallOutput> {
    let output: string;
    try {
      const registered = this.registry.resolve(call.name);
      if (!registered) throw new Error(`Tool not exposed: ${call.name}`);
      const decoded: unknown = JSON.parse(call.arguments);
      if (typeof decoded !== "object" || decoded === null || Array.isArray(decoded)) {
        throw new Error("Expected a JSON object for tool arguments");
      }
      const args = decoded as Record<string, unknown>;

      if (registered.serverId === "playwright" && registered.originalName === "browser_navigate") {
        const url = args.url;
        if (typeof url !== "string" || new URL(url).origin !== config.allowedOrigin) {
          throw new Error("Navigation outside TodoMVC demo origin is not permitted");
        }
      }
      if (registered.serverId === "filesystem") {
        if (typeof args.path !== "string" || !insideWorkspace(args.path)) {
          throw new Error(`Filesystem path must be inside ${config.workspace}`);
        }
      }

      await requireApproval(call.name, args);
      logger.info(`Routing ${call.name} to ${registered.serverId}`, args);
      const result = await registered.client.callTool({
        name: registered.originalName,
        arguments: args,
      });
      const serialized = JSON.stringify({
        isError: result.isError ?? false,
        content: result.content,
        structuredContent: result.structuredContent,
      });
      output = serialized.length > config.maxToolResultChars
        ? JSON.stringify({ truncated: true, text: serialized.slice(0, config.maxToolResultChars) })
        : serialized;
    } catch (err) {
      output = JSON.stringify({ isError: true, message: err instanceof Error ? err.message : String(err) });
      logger.warn(`Failed: ${call.name}`, output);
    }
    return { type: "function_call_output", call_id: call.call_id, output };
  }
}
