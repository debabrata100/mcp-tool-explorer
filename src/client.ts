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

    // // 6. Print tool details
    // for (const tool of tools) {
    //   console.log("Name:", tool.name);
    //   console.log("Description:", tool.description);
    //   console.log("Input Schema:", JSON.stringify(tool.inputSchema, null, 2));
    //   console.log("----------------------------");
    // }

    // const result = await client.callTool({
    //   name: "add_numbers",
    //   arguments: {
    //     a: 10,
    //     b: 20,
    //   },
    // });

    // console.log("Raw tool result:");
    // console.log(JSON.stringify(result, null, 2));

    const result = await client.callTool({
      name: "add_numbers",
      arguments: {
        a: "10",
        b: 20,
      },
    });

    if (result.isError) {
      console.error("Tool execution failed:", result.content);
    } else {
      for (const block of result.content) {
        if (block.type === "text") {
          console.log("Tool output:", block.text);
        }
      }
    }

    // const greetingResult = await client.callTool({
    //   name: "get_greeting",
    //   arguments: {
    //     name: "Deb",
    //   },
    // });

    // console.log(JSON.stringify(greetingResult, null, 2));
  } finally {
    // 7. Disconnect and stop the server
    await client.close();
  }
}

main().catch(console.error);
