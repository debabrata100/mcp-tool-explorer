import type { Client } from "@modelcontextprotocol/client";
import { config } from "../config/index.js";
import type { McpTool, OpenAITool } from "../types/tools.js";

export async function discoverTools(client: Client): Promise<McpTool[]> {
  const permitted = new Set<string>(config.allowedTools);
  const discovered: McpTool[] = [];
  let cursor: string | undefined;

  // MCP tool discovery may be paginated.
  do {
    const page = await client.listTools(cursor ? { cursor } : undefined);
    discovered.push(...page.tools.filter((tool) => permitted.has(tool.name)));
    cursor = page.nextCursor;
  } while (cursor);

  if (discovered.length === 0) {
    throw new Error("No permitted Playwright MCP tools were discovered");
  }
  return discovered;
}

export function toOpenAITools(tools: McpTool[]): OpenAITool[] {
  return tools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description ?? "",
    parameters: tool.inputSchema,
    strict: false,
  }));
}
