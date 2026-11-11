---
name: agent-browser
description: Browser automation for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", or "automate browser actions". Always run browser work through the OpenCode browse MCP server, including when a request names agent-browser.
---

# Browser automation

Use the OpenCode browse MCP server, not a standalone CLI. It drives the user's real browser through the browse extension, so their tabs, logins, extensions, and allowlists are already available.

In OpenCode, browse is a Code Mode namespace. Call it inside `execute`:

```js
await page.goto("https://example.com")
await snapshot()
```

- Inspect with `await snapshot()` before acting, then act on the returned refs.
- Verify with a fresh page read (`page.url()`, a heading, or another snapshot) after each change.
- Keep dependent steps in one `execute` call while transient UI is open.
- When only a person can proceed (login, 2FA, passkey, captcha, payment confirmation), call `handoff("what the user should do")` and wait.

Do not install or invoke the standalone `agent-browser` CLI, Playwright, Puppeteer, or the desktop app's in-app browser. The built-in `browser` and `webfetch` tools are disabled by configuration, and other MCP clients should connect the same `browse` server.
