import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

async function main() {
  const client = new Client({
    name: "playwright-test-client",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["--no-install", "playwright-mcp"],
  });

  try {
    // Connect and spawn Playwright MCP
    await client.connect(transport);

    // Discover supported browser tools
    const { tools } = await client.listTools();

    console.log("Available tools:");

    for (const tool of tools) {
      console.log(`${tool.name}: ${tool.description ?? ""}`);
    }

    // Navigate to a website manually
    const result = await client.callTool({
      name: "browser_navigate",
      arguments: {
        url: "https://demo.playwright.dev/todomvc",
      },
    });

    console.log("\nBrowser result:");

    for (const block of result.content ?? []) {
      if (block.type === "text") {
        console.log(block.text);
      }
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
