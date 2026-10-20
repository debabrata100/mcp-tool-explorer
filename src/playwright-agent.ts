import "dotenv/config";
import OpenAI from "openai";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const openai = new OpenAI();

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
const MAX_ROUNDS = 10;
const MAX_RESULT_CHARS = 12000;

// Only expose tools needed for our TodoMVC task.
const ALLOWED_TOOLS = new Set([
  "browser_navigate",
  "browser_snapshot",
  "browser_type",
  "browser_click",
  "browser_verify_text_visible",
]);

async function main() {
  const mcpClient = new Client({
    name: "playwright-ai-agent",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["--no-install", "playwright-mcp"],
  });

  try {
    await mcpClient.connect(transport);

    // 1. Discover Playwright tools
    const { tools } = await mcpClient.listTools();

    const selectedTools = tools.filter((tool) => ALLOWED_TOOLS.has(tool.name));

    console.log(
      "Selected tools:",
      selectedTools.map((tool) => tool.name),
    );

    // 2. Convert MCP schemas into OpenAI tools
    const openaiTools = selectedTools.map((tool) => ({
      type: "function" as const,
      name: tool.name,
      description: tool.description ?? "",
      parameters: tool.inputSchema,
      strict: false,
    }));

    const prompt = `
      Navigate to https://demo.playwright.dev/todomvc.

      Add two todo items:
      1. Learn MCP
      2. Learn Playwright

      Verify that both items are visible on the page.
      Report whether the task succeeded.
    `;

    // 3. Initial OpenAI request
    let response = await openai.responses.create({
      model: MODEL,
      instructions: `
        You are a browser automation assistant.
        Use the provided browser tools.
        Only interact with demo.playwright.dev.
        Inspect the page before interacting.
        Do not claim success without verification.
        Keep your final response concise.
      `,
      input: prompt,
      tools: openaiTools,
      tool_choice: "required",
      max_output_tokens: 1200,
    });

    // 4. Agent execution loop
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const calls = response.output.filter(
        (item) => item.type === "function_call",
      );

      if (calls.length === 0) {
        console.log("\nAgent response:");
        console.log(response.output_text);
        return;
      }

      const toolOutputs: Array<{
        type: "function_call_output";
        call_id: string;
        output: string;
      }> = [];

      // 5. Execute requested tools sequentially
      for (const call of calls) {
        console.log(`\nExecuting: ${call.name}`);

        let output: string;

        try {
          if (!ALLOWED_TOOLS.has(call.name)) {
            throw new Error("Tool not allowed");
          }

          if (!selectedTools.some((t) => t.name === call.name)) {
            throw new Error("Unknown MCP tool");
          }

          const parsed: unknown = JSON.parse(call.arguments);

          if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw new Error("Invalid arguments");
          }

          // Restrict navigation to our demo website.
          if (call.name === "browser_navigate") {
            const url = (parsed as Record<string, unknown>).url;

            if (
              typeof url !== "string" ||
              new URL(url).origin !== "https://demo.playwright.dev"
            ) {
              throw new Error("Navigation not permitted");
            }
          }

          const result = await mcpClient.callTool({
            name: call.name,
            arguments: parsed,
          });

          output = JSON.stringify({
            isError: result.isError ?? false,
            content: result.content,
          }).slice(0, MAX_RESULT_CHARS);

          console.log("Tool completed");
        } catch (error) {
          output = JSON.stringify({
            isError: true,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }

        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output,
        });
      }

      // 6. Return MCP results to OpenAI
      response = await openai.responses.create({
        model: MODEL,
        previous_response_id: response.id,
        input: toolOutputs,
        tools: openaiTools,
        tool_choice: "auto",
        max_output_tokens: 1200,
      });
    }

    console.log("Agent stopped: maximum rounds reached.");
  } finally {
    await mcpClient.close();
  }
}

main().catch(console.error);
