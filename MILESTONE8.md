# Milestone 8 — Multi-turn conversation memory

## What's new
- `src/memory/session.ts`: stores the last OpenAI response ID for this running conversation.
- `src/agents/browser.agent.ts`: chains *new user turns* using `previous_response_id`, not just tool results. It repeats safety `instructions` on every model call because the API does not carry these over automatically.
- `src/chat.ts`: an interactive REPL using one Playwright MCP client/server and one browser session for the entire process.
- `src/security/approval.ts`: reuses the REPL prompt during human approval to avoid competing stdin readers. Standalone use still works.

## Install and start
Use your existing project root (not this ZIP's parent directory):

```bash
npm install
npm pkg set scripts.chat='tsx src/chat.ts'
npm run chat
```

Requires `OPENAI_API_KEY`, `openai`, `dotenv`, `@modelcontextprotocol/client`, `@modelcontextprotocol/server`, `@playwright/mcp`, `tsx`, and Node.js 20+.

Sample interaction:

```
You> Open https://demo.playwright.dev/todomvc and add Learn MCP
...approval for typing...
Agent> Added Learn MCP.
You> Add Learn Playwright too, then check both todos are present
...approval...
Agent> Both items are present.
You> /new
Conversation chain reset. Browser is still open.
You> /exit
```

`/new` resets **conversation context**, but deliberately does not reset the browser. To get a fresh browser, exit and restart. Approval is still required for mutating tools, and only `https://demo.playwright.dev` is permitted by the basic navigation validator.

## Memory model
- **During the process:** `ConversationSession.previousResponseId` points to the latest response. OpenAI stores the linked response chain; browser state resides in the spawned Playwright process.
- **After exit/restart:** this example does **not** restore either the response ID or the browser process. No durable thread checkpoint/database is implemented yet.
- `previous_response_id` does not make prior tokens free: earlier context can still count for billing. Tool outputs and browser snapshots may be large.
- OpenAI response IDs and stored conversations depend on API data retention and are not a substitute for application-side durable memory.
- User input and tool outputs should be treated as untrusted; approvals and URL checks are basic teaching examples, not a full browser security boundary.

## Suggested commit

```bash
git add src MILESTONE8.md
git commit -m "feat(agent): add multi-turn MCP browser chat with response-chain memory"
```
