# Global Engineering Instructions

Build the smallest correct solution using established project conventions.

- Prefer proven technology and existing abstractions over novelty.
- Fix root causes without expanding scope unnecessarily.
- Validate untrusted input at boundaries; trust established internal contracts.
- Preserve intentional behavior and architectural invariants.
- Consider concrete failure modes before adding defensive complexity.
- Use `engineering-principles` for nontrivial stateful logic, concurrency, persistence, retries, or external I/O.
- Retrieve relevant GitHub context when investigating issues, PRs, regressions, or CI failures.
- Docs first: before changing behavior, update the existing documentation that states it so it describes the intended behavior. Do not create new documents for this. If checking the code shows a document is wrong, fix it in the same change.
- Verify affected behavior with the repository's tests, linters, type checks and build. Never report a check as passing unless it ran and passed in this session. Report any verification gap.
- Keep changes and PRs focused.

Use subagents when independent work benefits from parallelism. Avoid unnecessary plans, new documents, abstractions, and orchestration.

## Commits

Use `type: summary` with one of `feat`, `fix`, `docs`, `chore`, `refactor`, or `test`. Do not include a scope.

- Explain WHY from an end user perspective, not WHAT changed.
- Be specific about the user-facing change. Generic messages like "improved agent experience" are not acceptable.
- If there are merge conflicts, do not fix them. Notify me.

## Messages

When I am the one communicating, load and follow the `write-message` skill before drafting or sending. That means a message to another person in my name: a comment or reply, an email, a chat message.

Artifacts are not messages. PR descriptions, commit messages, issues you file for the work, and documents follow their own skills and conventions, not `write-message`.

## Tooling

Use `mise` to manage tools and runtimes.

Prefer:

- `rg`, `fd` — Search code and files.
- `jq`, `yq` — Process structured data.
- `gh`, `ghq` — GitHub operations and repository management.
- `bun`, `node`, `uv` — JavaScript and Python tooling, following project conventions.
- `gitleaks`, `semgrep`, `trivy` — Security checks when relevant.
- `webfetch` — One static document whose URL is already known, when you need the raw page or a non-HTML resource.
- `defuddle` — Clean Markdown extracted from a known URL's HTML page; it strips navigation and ads. Use it instead of `webfetch` when you want readable article content.
- `browse` — Everything else, through the OpenCode browse MCP server (`tools.browse.*`). The built-in `browser` tool is disabled; do not use a standalone browser CLI.
- `agent-desktop` — Desktop interaction.
- `webreel` — Capture browser interactions when visual evidence is useful.
- `opensrc` — Inspect dependency source when documentation or types are insufficient.

Pick the cheapest tool that works: `webfetch` for raw fetches and non-HTML, `defuddle` for article-like pages, `browse` when the page needs JavaScript, a login, or interaction. If `webfetch` or `defuddle` returns an empty shell or a challenge, switch to `browse` once instead of retrying.
