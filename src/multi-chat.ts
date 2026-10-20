import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { MultiServerAgent } from "./agents/multi-server.agent.js";
import { McpRegistry } from "./mcp/registry.js";
import { RoutedToolExecutor } from "./mcp/routed-tool-executor.js";
import { createOpenAIClient } from "./providers/openai.js";
import { setApprovalQuestion } from "./security/approval.js";
import { config } from "./config/index.js";

async function main() {
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error("Run in an interactive terminal");
  const registry = new McpRegistry();
  const terminal = createInterface({ input: stdin, output: stdout });
  setApprovalQuestion((question) => terminal.question(question));
  try {
    await registry.connectAll();
    console.log("Discovered tools:", registry.listNames());
    console.log("Workspace:", config.workspace);
    console.log("Commands: /new, /exit");
    const agent = new MultiServerAgent(
      createOpenAIClient(),
      registry.listOpenAITools(),
      new RoutedToolExecutor(registry),
    );
    while (true) {
      let input: string;
      try {
        input = (await terminal.question("\nYou> ")).trim();
      } catch {
        break;
      }
      if (input === "/exit") break;
      if (input === "/new") {
        agent.session.reset();
        console.log("Conversation reset");
        continue;
      }
      if (!input) continue;
      try {
        console.log("Agent>", await agent.run(input));
      } catch (err) {
        console.error("Turn failed:", err);
      }
    }
  } finally {
    setApprovalQuestion(undefined);
    terminal.close();
    await registry.close();
  }
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
