import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { config } from "../config/index.js";

/** Owns the lifecycle of one MCP connection and its spawned server. */
export class McpClientManager {
  private readonly client = new Client({
    name: "playwright-ai-agent",
    version: "1.0.0",
  });
  private connected = false;

  async connect(): Promise<Client> {
    if (this.connected) return this.client;

    const transport = new StdioClientTransport({
      command: config.server.command,
      args: [...config.server.args],
    });
    await this.client.connect(transport);
    this.connected = true;
    return this.client;
  }

  async close(): Promise<void> {
    if (!this.connected) return;
    this.connected = false;
    await this.client.close();
  }
}
