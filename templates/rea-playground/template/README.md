# REA Playground

Isolated workspace for reverse engineering with [REA](https://rea.tools/).

## Setup

Creating this playground already ran:

```sh
mise trust
mise install
```

If setup did not complete, run those commands here. Then open OpenCode in this
directory. The project `opencode.json` starts the local REA MCP server from the
version pinned in `mise.toml`.

Verify the connection:

```sh
opencode mcp list
mise exec -- rea --version
mise exec -- rea mcp doctor --json
```

## Folders

| Folder | Purpose |
| --- | --- |
| `targets/` | Original, untouched artifacts |
| `extracted/` | Unpacked/converted copies |
| `evidence/` | REA evidence JSON, views, reports |
| `captures/` | Network captures, traces, logs, screenshots |
| `notes/` | Findings, hypotheses, `provenance.md` |
| `scripts/` | Target-specific helpers |
| `tools/` | User-supplied analysis tools |
| `tmp/` | Scratch |

## Tooling

`mise.toml` uses Bun as the npm backend and runs REA through Bun. Add CLI tools
(Java, Python, 7-Zip, ...) to `[tools]` and run `mise install`.

Put vendor GUI tools such as x64dbg, Ghidra, IDA, Hopper, or JADX in `tools/`.
They are not installed by mise.

## Providers

REA uses the analysis provider appropriate to the target. Optional native and
Android providers such as Ghidra, IDA, Hopper, and JADX are installed
separately; see the [REA setup guide](https://rea.tools/get-started/) for
current platform support.

## Scope

Only inspect software you are authorized to analyze. Keep proprietary targets,
captures, and evidence out of version control.
