import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { BrowserAgent } from "./agents/browser.agent.js";
import { McpClientManager } from "./mcp/client.js";
import { discoverTools, toOpenAITools } from "./mcp/tool-discovery.js";
import { McpToolExecutor } from "./mcp/tool-executor.js";
import { createOpenAIClient } from "./providers/openai.js";
import { setApprovalQuestion } from "./security/approval.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error("Interactive chat requires a terminal (TTY)");
  }

  const manager = new McpClientManager();
  const terminal = createInterface({ input: stdin, output: stdout });
  setApprovalQuestion((question) => terminal.question(question));
  try {
    const client = await manager.connect();
    const tools = await discoverTools(client);
    const executor = new McpToolExecutor(client, new Set(tools.map(t => t.name)));
    const agent = new BrowserAgent(createOpenAIClient(), toOpenAITools(tools), executor);
    console.log('MCP browser chat ready. Commands: /new, /exit');
    console.log('Example: Open https://demo.playwright.dev/todomvc and add Learn MCP');

    while (true) {
      let prompt: string;
      try {
        prompt = (await terminal.question('\nYou> ')).trim();
      } catch (error) {
        // Ctrl+D and closed terminals finish the session.
        break;
      }
      if (!prompt) continue;
      if (prompt === '/exit') break;
      if (prompt === '/new') {
        agent.session.reset();
        console.log('Conversation chain reset. Browser is still open.');
        continue;
      }
      try {
        const answer = await agent.run(prompt);
        console.log('\nAgent>', answer || '(No text returned)');
      } catch (error) {
        logger.error('Conversation turn failed', error);
        console.log('Try again, or /new to reset the response chain.');
      }
    }
  } finally {
    setApprovalQuestion(undefined);
    terminal.close();
    await manager.close();
  }
}

main().catch(error => {
  logger.error('Chat failed', error);
  process.exitCode = 1;
});
