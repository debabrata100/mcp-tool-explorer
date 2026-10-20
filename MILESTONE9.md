# Milestone 9 — Multiple MCP Servers

## Setup

From the project root:

```bash
npm install @modelcontextprotocol/server-filesystem
npm install -D @playwright/mcp
npm pkg set scripts.chat9="tsx src/multi-chat.ts"
npm run chat9
```

Requires existing `@modelcontextprotocol/client`, `openai`, `tsx`, `dotenv`, and a valid `.env` with `OPENAI_API_KEY`. If your existing project uses v1 MCP SDK, migrate to v2 first.

## Example

1. Run `npm run chat9`.
2. At the prompt, ask: `Open https://demo.playwright.dev/todomvc, inspect its heading, and write a short summary to <workspace>/summary.txt`. Replace `<workspace>` with the absolute workspace path printed at startup.
3. Approve the write operation only after inspecting the proposed contents.
4. Ask: `Read the summary file back to me`.

## Architecture

- `src/mcp/registry.ts`: one Client per server; discover and namespace tools; route lookup.
- `src/mcp/routed-tool-executor.ts`: validate incoming tool name/arguments, gate mutations, dispatch to the owning server.
- `src/agents/multi-server.agent.ts`: OpenAI Responses API tool loop + existing response-ID session memory.
- `src/security/approval.ts`: shared human approval prompt.
- `src/multi-chat.ts`: multi-turn terminal.

**Security:** Filesystem access is restricted by the server to `agent-workspace/` and by a second host-side path check. Do not point it at your home directory. Browser origin checks on direct navigation do not prevent every redirect or indirect browser navigation. This is a learning demo, not a production sandbox. Do not use untrusted websites for tasks that can write to the filesystem.

The original Milestone 8 files remain for comparison.
