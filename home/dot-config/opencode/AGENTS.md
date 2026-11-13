# Global Engineering Instructions

Build the smallest correct solution using established project conventions.

- Prefer proven technology and existing abstractions over novelty.
- Fix root causes without expanding scope unnecessarily.
- Validate untrusted input at boundaries; trust established internal contracts.
- Preserve intentional behavior and architectural invariants.
- Consider concrete failure modes before adding defensive complexity.
- Use `engineering-principles` for nontrivial stateful logic, concurrency, persistence, retries, or external I/O.
- Retrieve relevant GitHub context when investigating issues, PRs, regressions, or CI failures.
- Establish expected behavior before significant changes. Document durable contracts and decisions when warranted.
- Verify affected behavior and report any verification gaps.
- Keep changes and PRs focused.

Use subagents when independent work benefits from parallelism. Avoid unnecessary plans, documentation, abstractions, and orchestration.

When composing any external communication on my behalf, load
and follow the `communicate` skill before drafting or sending.

## Tooling

Use `mise` to manage tools and runtimes.

Prefer:

- `rg`, `fd` — Search code and files.
- `jq`, `yq` — Process structured data.
- `gh`, `ghq` — GitHub operations and repository management.
- `bun`, `node`, `uv` — JavaScript and Python tooling, following project conventions.
- `gitleaks`, `semgrep`, `trivy` — Security checks when relevant.
- `webfetch` — One static document whose URL is already known.
- `browse` — Everything else, through the OpenCode browse MCP server (`tools.browse.*`). The built-in `browser` tool is disabled; do not use a standalone browser CLI.
- `agent-desktop` — Desktop interaction.
- `webreel` — Capture browser interactions when visual evidence is useful.
- `opensrc` — Inspect dependency source when documentation or types are insufficient.

If `webfetch` returns an empty shell or a challenge, switch to `browse` once instead of retrying it.
