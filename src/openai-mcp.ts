import "dotenv/config";
import OpenAI from "openai";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

async function main() {
  // STEP 1: Initialize OpenAI
  const openai = new OpenAI();

  // STEP 2: Create MCP client
  const mcpClient = new Client({
    name: "openai-mcp-host",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/server.ts"],
  });

  try {
    // STEP 3: Connect to MCP server
    await mcpClient.connect(transport);
    console.log("Connected to MCP server");

    // STEP 4: Discover MCP tools
    const { tools: mcpTools } = await mcpClient.listTools();

    console.log(
      "Discovered MCP tools:",
      mcpTools.map((tool) => tool.name),
    );

    // STEP 5: Convert MCP tools to OpenAI functions
    const openaiTools = mcpTools.map((tool) => ({
      type: "function" as const,
      name: tool.name,
      description: tool.description ?? "",
      parameters: tool.inputSchema,
      strict: false,
    }));

    console.log("OpenAI tools:", JSON.stringify(openaiTools, null, 2));

    // STEP 6: Ask OpenAI to choose a tool
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: "What is 125 plus 375?",
      tools: openaiTools,
      tool_choice: "required",
    });

    // STEP 7: Inspect the model's function calls
    for (const item of response.output) {
      if (item.type === "function_call") {
        console.log("\nModel requested a function call:");
        console.log("Name:", item.name);
        console.log("Arguments:", item.arguments);
        console.log("Call ID:", item.call_id);
      }
    }
  } finally {
    // STEP 8: Clean up
    await mcpClient.close();
  }
}

main().catch(console.error);
