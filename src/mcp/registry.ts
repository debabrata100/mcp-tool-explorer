import { mkdir } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { config } from "../config/index.js";
import type { McpTool, OpenAITool } from "../types/tools.js";

export type ServerId = keyof typeof config.servers;
export type RegisteredTool = {
  serverId: ServerId;
  originalName: string;
  client: Client;
  definition: McpTool;
};

/** Owns independent MCP connections and maps globally unique tool names to servers. */
export class McpRegistry {
  private readonly clients = new Map<ServerId, Client>();
  private readonly tools = new Map<string, RegisteredTool>();

  async connectAll(): Promise<void> {
    await mkdir(config.workspace, { recursive: true });
    try {
      for (const serverId of Object.keys(config.servers) as ServerId[]) {
        const cfg = config.servers[serverId];
        const client = new Client({ name: `agent-${serverId}`, version: "1.0.0" });
        const transport = new StdioClientTransport({ command: cfg.command, args: [...cfg.args] });
        await client.connect(transport);
        this.clients.set(serverId, client);
        let cursor: string | undefined;
        do {
          const page = await client.listTools(cursor ? { cursor } : undefined);
          for (const tool of page.tools) {
            if (!(cfg.allowedTools as readonly string[]).includes(tool.name)) continue;
            const exposedName = `${serverId}__${tool.name}`;
            if (this.tools.has(exposedName)) throw new Error(`Duplicate tool ${exposedName}`);
            this.tools.set(exposedName, {
              serverId, originalName: tool.name, client, definition: tool,
            });
          }
          cursor = page.nextCursor;
        } while (cursor);
      }
      if (!this.tools.size) throw new Error("No allowed tools discovered");
    } catch (err) {
      await this.close();
      throw err;
    }
  }

  resolve(name: string): RegisteredTool | undefined { return this.tools.get(name); }

  listOpenAITools(): OpenAITool[] {
    return [...this.tools.entries()].map(([name, entry]) => ({
      type: "function", name,
      description: `[${entry.serverId}] ${entry.definition.description ?? ""}`,
      parameters: entry.definition.inputSchema,
      strict: false,
    }));
  }

  listNames(): string[] { return [...this.tools.keys()]; }

  async close(): Promise<void> {
    const clients = [...this.clients.values()];
    this.clients.clear();
    this.tools.clear();
    await Promise.allSettled(clients.map((client) => client.close()));
  }
}
