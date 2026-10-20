import type { Client } from "@modelcontextprotocol/client";

export type McpTool = Awaited<ReturnType<Client["listTools"]>>["tools"][number];

export type OpenAITool = {
  type: "function";
  name: string;
  description: string;
  parameters: McpTool["inputSchema"];
  strict: false;
};

export type ToolCallRequest = {
  name: string;
  arguments: string;
  call_id: string;
};

export type ToolCallOutput = {
  type: "function_call_output";
  call_id: string;
  output: string;
};
