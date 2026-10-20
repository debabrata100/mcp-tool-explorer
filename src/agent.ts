import "dotenv/config";
import OpenAI from "openai";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const MODEL = "gpt-5.6-luna";
const MAX_TOOL_ROUNDS = 2;

async function main() {
  const openai = new OpenAI();

  const mcpClient = new Client({
    name: "my-mcp-agent",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/server.ts"],
  });

  try {
    // 1. Connect to MCP server
    await mcpClient.connect(transport);

    // 2. Discover tools
    const { tools: mcpTools } = await mcpClient.listTools();

    const allowedToolNames = new Set(mcpTools.map((tool) => tool.name));

    // 3. Convert MCP tools to OpenAI tools
    const openaiTools = mcpTools.map((tool) => ({
      type: "function" as const,
      name: tool.name,
      description: tool.description ?? "",
      parameters: tool.inputSchema,
      strict: false,
    }));

    console.log("Available tools:", [...allowedToolNames]);

    // 4. Initial user request
    let response = await openai.responses.create({
      model: MODEL,
      input: "Greet me and calculate 15 + 25, 10 + 20, and 100 + 200.",
      tools: openaiTools,
      tool_choice: "auto",
      max_output_tokens: 800,
    });

    // 5. Tool execution loop
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const functionCalls = response.output.filter(
        (item) => item.type === "function_call",
      );
      console.log(
        `\nRound ${round + 1}: ${functionCalls.length} tool calls requested`,
      );
      // No more tool calls: model is finished
      if (functionCalls.length === 0) {
        console.log("\nFinal answer:");
        console.log(response.output_text);
        return;
      }

      const toolOutputs: Array<{
        type: "function_call_output";
        call_id: string;
        output: string;
      }> = [];

      // 6. Execute each requested MCP tool
      for (const call of functionCalls) {
        console.log("\nTool requested:", call.name);
        console.log("Arguments:", call.arguments);

        let output: string;

        try {
          if (!allowedToolNames.has(call.name)) {
            throw new Error("Tool is not allowed");
          }

          const args: unknown = JSON.parse(call.arguments);

          if (
            typeof args !== "object" ||
            args === null ||
            Array.isArray(args)
          ) {
            throw new Error("Invalid tool arguments");
          }

          const result = await mcpClient.callTool({
            name: call.name,
            arguments: args,
          });

          // Include errors and structured results too
          output = JSON.stringify({
            isError: result.isError ?? false,
            content: result.content,
            structuredContent: result.structuredContent,
          });

          console.log("MCP result:", output);
        } catch (error) {
          output = JSON.stringify({
            isError: true,
            message:
              error instanceof Error ? error.message : "Unknown tool error",
          });
        }

        // 7. Match tool result to original call
        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output,
        });
      }

      // 8. Return tool results to OpenAI
      response = await openai.responses.create({
        model: MODEL,
        previous_response_id: response.id,
        input: toolOutputs,
        tools: openaiTools,
        tool_choice: "auto",
        max_output_tokens: 800,
      });
    }

    console.error("Stopped: maximum tool rounds reached");
  } finally {
    await mcpClient.close();
  }
}

main().catch(console.error);
