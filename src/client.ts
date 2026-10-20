import "dotenv/config";
import OpenAI from "openai";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

async function main() {
  // 1. Initialize OpenAI SDK
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("OpenAI SDK initialized");

  // We'll use openai in the next milestone.
  void openai;

  // 2. Create MCP client
  const client = new Client({
    name: "my-first-mcp-client",
    version: "1.0.0",
  });

  // 3. Configure how to launch the server
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/server.ts"],
  });

  try {
    // 4. Spawn server + initialize connection
    await client.connect(transport);

    console.log("Connected to MCP server");

    // 5. Discover available tools
    const { tools } = await client.listTools();

    console.log(`\nDiscovered ${tools.length} tools\n`);

    // 6. Print tool details
    for (const tool of tools) {
      console.log("Name:", tool.name);
      console.log("Description:", tool.description);
      console.log("Input Schema:", JSON.stringify(tool.inputSchema, null, 2));
      console.log("----------------------------");
    }
  } finally {
    // 7. Disconnect and stop the server
    await client.close();
  }
}

main().catch(console.error);
