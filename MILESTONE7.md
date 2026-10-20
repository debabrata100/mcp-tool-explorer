# Milestone 7: Human Approval and Tool Safety

This builds on the Milestone 6 source and adds `src/security/approval.ts`.

## What changed
- MCP tool executor now calls `requireApproval()` before `browser_click` and `browser_type`.
- Read-only `browser_snapshot` and `browser_navigate` don't require confirmation, but navigation is limited to `https://demo.playwright.dev` for direct navigation requests.
- Approval defaults to **No**. Only `y`/`yes` allows execution.
- In non-interactive terminals, approval fails closed and the MCP tool is not called.
- Denied calls are returned as `isError: true` output, so the agent can report that approval was denied.

## Run
From your existing project root, with its dependencies installed:

```sh
npm run agent6
```

Or:

```sh
npx tsx src/index.ts 'Open https://demo.playwright.dev/todomvc and add "Learn MCP"'
```

The terminal should ask for approval before typing or clicking. Try `n` first, then restart and choose `y`.

## Important limitations
- This is a **learning/demo guardrail**, not a production security boundary. A page can navigate via redirects or browser-side JavaScript; a host-side check of `browser_navigate` arguments alone does not enforce a browser-wide network allowlist.
- `browser_click` can cause navigation, form submission or other effects. Approval is required because its impact is not intrinsically read-only.
- `browser_type` may type sensitive data; do not enter secrets into untrusted pages.
- For production use, enforce network/domain restrictions at the browser/network level, maintain an explicit tool risk policy and validate parameters against the advertised tool schemas. Also protect against prompt injection from page content.
- Don't turn off `requireHumanApproval` except when using a trusted local test environment.
