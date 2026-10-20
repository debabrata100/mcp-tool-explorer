import { BrowserAgent } from "./agents/browser.agent.js";
import { McpClientManager } from "./mcp/client.js";
import { discoverTools, toOpenAITools } from "./mcp/tool-discovery.js";
import { McpToolExecutor } from "./mcp/tool-executor.js";
import { createOpenAIClient } from "./providers/openai.js";
import { logger } from "./utils/logger.js";

const DEFAULT_TASK = [
  "Open https://demo.playwright.dev/todomvc.",
  'Add todo items "Learn MCP" and "Learn Playwright".',
  "Verify both items appear and report the result.",
].join(" ");

async function main(): Promise<void> {
  const manager = new McpClientManager();
  try {
    const mcpClient = await manager.connect();
    const tools = await discoverTools(mcpClient);
    logger.info("Discovered tools", tools.map((tool) => tool.name));

    const toolNames = new Set(tools.map((tool) => tool.name));
    const executor = new McpToolExecutor(mcpClient, toolNames);
    const agent = new BrowserAgent(createOpenAIClient(), toOpenAITools(tools), executor);

    const prompt = process.argv.slice(2).join(" ").trim() || DEFAULT_TASK;
    const answer = await agent.run(prompt);
    logger.info("Final answer", answer);
  } finally {
    await manager.close();
  }
}

main().catch((error) => {
  logger.error("Agent failed", error);
  process.exitCode = 1;
});
