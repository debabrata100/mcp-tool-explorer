import "dotenv/config";
import { resolve } from "node:path";

export const config = {
  model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  maxToolRounds: 14,
  maxOutputTokens: 1200,
  maxToolResultChars: 12000,
  allowedOrigin: "https://demo.playwright.dev",
  workspace: resolve(process.cwd(), "agent-workspace"),
  requireHumanApproval: true,
  servers: {
    playwright: {
      command: "npx",
      args: ["--no-install", "playwright-mcp"],
      allowedTools: ["browser_navigate", "browser_snapshot", "browser_type", "browser_click"],
    },
    filesystem: {
      command: "npx",
      args: ["--no-install", "mcp-server-filesystem", resolve(process.cwd(), "agent-workspace")],
      allowedTools: ["list_directory", "read_text_file", "write_file"],
    },
  },
} as const;
