# Dotfile Notes

- `home/dot-gitconfig` is symlinked to `~/.gitconfig`; editing it changes the live config immediately. `~/.gitconfig-identity` is included from it.
- `home/dot-gitconfig-identity` is a placeholder copied with `create_if_missing = true`. Fill `~/.gitconfig-identity` per machine; the final bootstrap hook prompts until the "Your Name" placeholder is gone. `mise run gitconfig:identity` opens it.
- SSH signing uses `~/.ssh/id_ed25519.pub`. `allowed_signers` is intentionally not managed or committed, so `git log --show-signature` has no local verification file.
- `~/.config/mise/config.toml` is symlinked to `home/dot-config/mise/config.toml`; edits are live and `mise bootstrap` re-reads it and installs tools.
- `~/.config/opencode` is deployed with `symlink-each`. Only config files belong in `home/dot-config/opencode`; never add `service.json`, `cli.json`, `opencode.json`, or `*.bak`.
- `git config --global` ignores `include.path` unless `--includes` is passed; use `git config user.name` or `git config --global --includes --list` in scripts.
