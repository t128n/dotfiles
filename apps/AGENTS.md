# Apps Notes

- `apps/<os>/` holds native app declarations. `scripts/apps/` applies them: `mise run apps` installs, and `mise run apps:check` reports drift without changing the machine.
- These files are not deployed by `[dotfiles]` and are not run by `mise bootstrap`. `mise run apps` is an explicit step after setup.
- Only apps, fonts, and machine-level libraries belong here. CLI toolchains and development CLIs belong in `home/dot-config/mise/config.toml` `[tools]`.
- Windows: `apps/windows/winget.dsc.yaml` is a WinGet Configuration (DSC schema 0.2) file applied with `winget configure`. Inventory with `winget configure export --all -o <file>` and keep only intentionally managed entries. Add `securityContext: elevated` when an installer needs machine-wide access; WinGet then prompts for UAC once per run. Developer Mode must still be enabled before `mise bootstrap` so it can create symlinks; the DSC entry is only for drift repair.
- macOS: `apps/macos/Brewfile` is applied with `brew bundle`. Inventory with `brew bundle dump --force --file apps/macos/Brewfile`. Use `cask` for apps and fonts, `mas` for App Store apps, and `brew` only for machine-level libraries.
- Linux: `apps/linux/<manager>.txt` has one native package name per line; blank lines and `#` comments are ignored. The dispatcher detects `apt`, `dnf`, or `pacman`; create the matching list when needed. Do not duplicate packages that mise `[tools]` installs.
- Keep `scripts/apps/apply.sh` compatible with macOS Bash 3.2: no associative arrays, and do not expand empty arrays under `set -u`.
