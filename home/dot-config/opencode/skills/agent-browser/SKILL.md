---
name: agent-browser
description: Browser automation for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", or "automate browser actions". Always run browser work through the OpenCode browse MCP server, including when a request names agent-browser.
---

# Browser automation

Use the OpenCode browse MCP server, not a standalone CLI. It drives the user's real browser through the browse extension, so their tabs, logins, extensions, and allowlists are already available.

## Which tool

`webfetch` handles one static document whose URL is already known: documentation pages, READMEs, changelogs, release notes, RFCs, package metadata, raw files, single HTML pages. It carries no session, so JavaScript-rendered, login-gated, and non-HTML targets fail there.

Browse handles everything else: research and multi-page retrieval, finding URLs, JavaScript- or cookie-gated content, forms, clicks and pagination, screenshots and visual evidence, and sites that refuse non-browser clients.

If `webfetch` returns an empty shell, a consent wall, or a bot challenge, switch to browse once rather than retrying it.

## Driving the browser

In OpenCode, browse is a Code Mode namespace. Call it inside `execute`:

```js
await page.goto("https://example.com")
await snapshot()
```

- Inspect with `await snapshot()` before acting, then act on the returned refs.
- Verify with a fresh page read (`page.url()`, a heading, or another snapshot) after each change.
- Keep dependent steps in one `execute` call while transient UI is open.
- When only a person can proceed (login, 2FA, passkey, captcha, payment confirmation), call `handoff("what the user should do")` and wait.

## When it breaks

- `browse doctor` reports install, relay, extension, and pairing faults; `browse status` is the cheaper read of sessions, targets, and connected browsers. Run doctor first, then status.
- After a relay restart the extension reconnects on its next poll, about 30 seconds; read `pairing: not-seen` only after that.
- `execute` times out after 60 seconds by default; raise `timeoutMs` for slow pages. `Tabs cannot be edited right now` and `connectOverCDP` timeouts are transient: retry once, then run `browse status`.
- A failed navigation still leaves a session and a tab behind; `session_reset` or `session_delete` when the work is done.
- `browse skill` prints the longer reference that ships with the CLI.

Do not install or invoke the standalone `agent-browser` CLI, Playwright, Puppeteer, or the desktop app's in-app browser; other MCP clients should connect the same `browse` server.
