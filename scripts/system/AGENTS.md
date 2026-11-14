# System Configuration Notes

- `run.ts` is the Bun-based declarative OS-state runner (DSC/NixOS-style `test` / `set` / `unset`).
- Resources live under `resources/common/` (cross-platform) and `resources/<os>/` (`windows`, `macos`, `linux`). Files starting with `_` are templates and are skipped.
- Resource contract (`defineResource` in `lib/types.ts`):
  - `test(ctx)` returns `true` when the machine already matches the desired state.
  - `set(ctx)` enforces the desired state and throws on failure.
  - `unset(ctx)` is an optional restore hook; normal runs never call it.
  - Generic resources may set `platforms` and `windowsCmd` / `macosCmd` / `linuxCmd` (executed via `runPlatformCommand`).
- Post-install hooks: resources call `ctx.onPostInstall(name, fn)` (for example `requestExplorerRestart(ctx)`). Hooks are deduplicated by `name` and run once at the end of an `--apply` run.
- Resources are idempotent and should not print routine output; `run.ts` reports `ok`, `pending`, `applied`, and `postinstall`.
- Default is dry-run; pass `--apply` to enforce changes, and optional resource names to filter (e.g. `mise run system --apply Set-Cursor`).
- Machine-wide Windows changes use `invokeElevated()` from `lib/windows.ts` (prompts for UAC unless already elevated). Keep elevated scripts self-contained and stage large payloads in a temp file (`Set-DefaultAssociations.ts`).
- `mise.toml` deploys this directory to `~/.local/share/t128n-dotfiles/scripts/system`. The global `system` task in `home/dot-config/mise/config.toml` calls `bun .../run.ts`.
