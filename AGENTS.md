# Project Notes

- This repo is a mise bootstrap project. New machines use `mise bootstrap --from https://github.com/t128n/dotfiles.git`; local changes use `mise run setup` or `mise run apply`.
- Global tools live in `home/dot-config/mise/config.toml` (symlinked to `~/.config/mise/config.toml`). `[tools]` in the root `mise.toml` is project-scoped and only installs during bootstrap.
- `[dotfiles]` `source` paths resolve from the config file's directory. `dotfiles.root = "home"` only affects `mise dot add` and entries without `source`.
- Do not set `dotfiles.windows_symlinks`; it applies to every inherited `symlink-each` entry and conflicts with existing copies. Use per-entry `mode = "symlink"`.
- `mise dot apply` merges global `[dotfiles]` entries.
- On Windows, `symlink-each` copies; after changing a source, run `mise dot apply --force` to replace the old copy.
- Do not call `mise dot status` from `[tasks.bootstrap]`; it reports the in-flight bootstrap as an unfinished operation. Use `mise dot diff`.
- Bootstrap hooks and tasks use `cmd /c` on Windows and `sh` on Unix. Use `run_windows` for platform-specific commands.
- `mise bootstrap --from` only prints the clone command in `--dry-run`; it needs a real clone before it can plan.
- `apps/<os>/` holds native app declarations. `mise run apps` installs them and `mise run apps:check` reports drift; neither is deployed to `$HOME` or run by `mise bootstrap`. See `apps/AGENTS.md`.
- `scripts/cleanup/` holds per-OS system-state items. `mise run clean` reports drift and `mise run clean --apply` applies the declared state; the directory is deployed to `~/.local/share/t128n-dotfiles/scripts/cleanup` so the task works anywhere. See `scripts/cleanup/AGENTS.md`.
