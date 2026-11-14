# Cleanup Notes

- `windows.ps1`, `macos.sh`, and `linux.sh` are executors. `run.sh` dispatches POSIX runs by `uname` and forwards `--apply`.
- Each item is one small file under `items/<os>/`, discovered and sourced by the executor. Files starting with `_` are templates and are skipped.
- Item contract:
  - POSIX: `test_item`, `set_item`, `unset_item`.
  - PowerShell: `Test-CleanupItem`, `Set-CleanupItem`, `Unset-CleanupItem`.
  - Test returns true/0 when the item is already in the desired state. Set enforces the desired state and returns non-zero/throws on failure. Unset is a restore hook and is never called by the item run.
- Items are idempotent: items already in the desired state are skipped, and a repeated `--apply` run succeeds. Items should not print routine output; the executor reports item names.
- PowerShell item files use an approved verb, for example `Remove-OpencodeDesktop.ps1` or `Set-Taskbar.ps1`. PowerShell items run in their own scope, so helper functions are safe.
- POSIX items share one shell scope, and the executor clears only the contract functions between files. Keep helpers inside the contract functions or give them unique names.
- Only add state you explicitly want enforced. Default is dry-run; `--apply` changes the machine. Removal items delete with no backup, so use the path helpers and keep `safe_path` / `Test-SafePath` intact.
- Removal uses the native package manager: WinGet, Homebrew, apt/dnf/pacman. Configuration items write the relevant per-user settings and apply them.
- Machine-wide Windows changes use `Invoke-ElevatedCommand` from the executor; it prompts for UAC unless the session is already elevated. Keep the command self-contained and use `throw` for failures.
- `Invoke-ElevatedCommand` passes the command on the elevated command line, which fails for multi-KB payloads. Stage large data in a temp file and pass its path (`Set-DefaultAssociations.ps1`).
- Default app associations are enforced with the machine `DefaultAssociationsConfiguration` policy, which Windows reapplies at every sign-in. The per-user `UserChoice` keys are hash-protected and rejected by the shell, so scripts cannot write them directly; `Set-DefaultAssociations.ps1` owns the XML and the policy value. Packaged (MSIX) apps such as NanaZip get a generated `AppX...` ProgId, which is valid in the XML; resolve it from the package registration instead of hard-coding the generated value.
- `mise.toml` deploys this directory to `~/.local/share/t128n-dotfiles/scripts/cleanup`. The global `clean` task in `home/dot-config/mise/config.toml` calls it, so items are edited here but run from any directory.
- Keep the shell scripts compatible with macOS's Bash 3.2: no associative arrays, and do not expand empty arrays under `set -u`.
