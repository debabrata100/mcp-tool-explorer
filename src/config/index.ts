import "dotenv/config";

export const config = {
  model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  maxToolRounds: 10,
  maxOutputTokens: 1200,
  maxToolResultChars: 12000,
  allowedOrigin: "https://demo.playwright.dev",
  // Limit exposure until you add stronger browser-level URL enforcement.
  requireHumanApproval: true,
  allowedTools: [
    "browser_navigate",
    "browser_snapshot",
    "browser_type",
    "browser_click",
  ],
  server: {
    command: "npx",
    args: ["--no-install", "playwright-mcp"],
  },
} as const;
