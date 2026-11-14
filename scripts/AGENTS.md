# Workspace Notes

- `setup-workspace.ts` defines `~/Workspace/{Repos,Resources,Scratch}` and puts `~/.local/bin` on PATH. Keep `ghq.root = ~/Workspace/Repos` in `home/dot-gitconfig` and the `workspace` task in `mise.toml` in sync.
- `setup-env.ts` mirrors the `[env]` block of the deployed global mise config into `HKCU\Environment` and appends the cargo bin directory to the user `PATH`. It is Windows-only (elsewhere mise activation is enough) and `--check` exits non-zero on drift. The names it wrote are recorded under `HKCU\Software\t128n\dotfiles`, so a value removed from `[env]` is deleted on the next run instead of lingering. `setup-workspace.ts` keeps owning `~/.local/bin` on `PATH`; do not move that entry here.
- `system/` holds the Bun-based declarative OS-state resources (removals and settings). See `system/AGENTS.md`.
- `apps/` applies the per-OS declarations in `apps/<os>/` through `apply.ts`. See `apps/AGENTS.md`.
