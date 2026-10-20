import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

function createServer(): McpServer {
  const server = new McpServer({
    name: "my-first-mcp-server",
    version: "1.0.0",
  });

  // Tool 1
  server.registerTool(
    "add_numbers",
    {
      description: "Add two numbers together",
      inputSchema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
      }),
    },
    async ({ a, b }) => ({
      content: [
        {
          type: "text",
          text: String(a + b),
        },
      ],
    }),
  );

  // Tool 2
  server.registerTool(
    "get_greeting",
    {
      description: "Generate a greeting for a person",
      inputSchema: z.object({
        name: z.string().describe("Person's name"),
      }),
    },
    async ({ name }) => ({
      content: [
        {
          type: "text",
          text: `Hello ${name}!`,
        },
      ],
    }),
  );

  return server;
}

// Start the MCP server over stdio.
void serveStdio(createServer);

console.error("MCP server running via stdio");
