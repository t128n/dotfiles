# REA Playground

This directory is an isolated reverse-engineering workspace. Use the
project-local `rea` MCP server and keep everything inside this directory.

## Folders

- `targets/` — original, untouched artifacts
- `extracted/` — unpacked/converted copies
- `evidence/` — REA evidence JSON, views, reports
- `captures/` — network captures, traces, logs, screenshots
- `notes/` — findings, hypotheses, `provenance.md`
- `scripts/` — target-specific helpers
- `tools/` — user-supplied analysis tools (x64dbg, Ghidra, IDA, Hopper, JADX)
- `tmp/` — scratch

## Rules

- Never execute an untrusted target on the host. Use static analysis, or a
  disposable VM/sandbox for dynamic analysis.
- Preserve originals: do not modify `targets/`; work on copies in `extracted/`.
- Record provenance before analysis: source, version, SHA-256, and acquisition
  date in `notes/provenance.md`.
- Keep large or proprietary artifacts out of git. `.gitignore` covers the
  artifact folders.
- Before analysis, confirm you are authorized to inspect the target.
- Use absolute paths with REA tools.

## Tooling

- CLI tools available through mise (Java, Python, 7-Zip, etc.) belong in this
  project's `mise.toml` under `[tools]`. Add the tool there, then run
  `mise install`. Do not install CLI tools globally for this playground.
  Example: add `java = "21"` under `[tools]`, then run `mise install`.
- GUI or vendor-provided tools (x64dbg, Ghidra, IDA, Hopper, JADX, etc.) are
  not installed by mise. Stop and ask the user to place them in `tools/` (or
  another directory in this playground the user chooses), then use that path.
  Do not download or install them yourself.
- Verify a newly added CLI tool with `mise exec -- <tool> --version` before
  relying on it.

## Workflow

1. Put the original artifact in `targets/` and hash it.
2. Copy or extract into `extracted/` when a workflow needs a directory or
   unpacked files.
3. Start with `binary_session` for native binaries,
   `analyze_javascript_application` for JS/Electron apps, or the matching REA
   workflow for the target.
4. Save evidence and reports under `evidence/`; link evidence IDs in `notes/`.
5. Write findings and reconstruction notes under `notes/`.

The `rea` MCP server runs the version pinned in this project's `mise.toml`.
