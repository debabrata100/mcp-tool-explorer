# Milestone 6 — Modular Playwright MCP Agent

This package includes your **original src files** plus the new modular implementation. Copy the contents of `src/` into your project `src/` directory.

## Modules

- `config/index.ts`: model, tool allowlist, round limits, browser origin, MCP executable.
- `providers/openai.ts`: OpenAI SDK client creation.
- `mcp/client.ts`: MCP process lifecycle and connection.
- `mcp/tool-discovery.ts`: list/paginate tools, filter allowlist, convert to OpenAI functions.
- `mcp/tool-executor.ts`: validate requests, call MCP tools, package tool outputs, handle errors.
- `agents/browser.agent.ts`: OpenAI function-call orchestration.
- `utils/logger.ts`: basic structured-prefix logging (not a full observability backend).
- `index.ts`: composition root and CLI prompt entry point.

## Run

From the project root (where package.json is located):

```bash
npm install
npm install -D @playwright/mcp tsx typescript @types/node
npm install openai @modelcontextprotocol/client @modelcontextprotocol/server dotenv zod
npm pkg set scripts.agent6="tsx src/index.ts"
# Put OPENAI_API_KEY=... in .env; optionally OPENAI_MODEL=gpt-4.1-mini
npm run agent6
npm run agent6 -- "Open https://demo.playwright.dev/todomvc and inspect the page"
```

Existing example scripts can continue targeting the original `src/playwright-agent.ts`, `src/agent.ts`, etc.

## Notes

- The host controls tool execution; the OpenAI model only *requests* function calls.
- `McpClientManager.connect()` spawns the MCP process via stdio.
- Tools are discovered dynamically; only approved names are exposed to OpenAI.
- Tool calls run sequentially because browser interactions mutate shared state.
- The navigation-origin guard is a **demo-only** safety control. It does not prevent redirects, links, downloads, or all indirect navigation. Use browser-level networking/permission controls for real deployments.
- MCP server validation remains authoritative for individual tool input schemas; this implementation performs basic host-side shape and allowlist checks.
- The existing ZIP has no `package.json` or lockfile, so full typechecking and live API/browser execution cannot be verified from this archive alone.
