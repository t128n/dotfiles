# t128n/dotfiles

machine setup with [mise](https://mise.jdx.dev).

## Docs

- [Helium configuration](docs/helium/README.md) — policies, first-run profile seed, extensions

## Setup

Install [Git](https://git-scm.com/downloads) if it is not already available, then use the commands for your platform.

### Bash (macOS/Linux)

```bash
# Install mise and activate it in bash
curl -fsSL https://mise.run | sh
export PATH="$HOME/.local/bin:$PATH"
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc

# Deploy this checkout
git clone https://github.com/t128n/dotfiles.git ~/Workspace/Repos/github.com/t128n/dotfiles
cd ~/Workspace/Repos/github.com/t128n/dotfiles
mise trust
mise bootstrap
mise run workspace
```

### PowerShell (Windows)

Install or upgrade to the latest PowerShell and Git first:

```powershell
winget install --id Microsoft.PowerShell --source winget --accept-source-agreements --accept-package-agreements
winget install --id Git.Git --source winget --accept-source-agreements --accept-package-agreements
```

In an elevated PowerShell 7 (`pwsh`) window, enable Developer Mode so mise can create symlinks:

```powershell
New-Item -Path HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock -Force | Out-Null
New-ItemProperty -Path HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock -Name AllowDevelopmentWithoutDevLicense -Value 1 -PropertyType DWord -Force | Out-Null
```

Then open a normal PowerShell 7 (`pwsh`) window:

```powershell
# Install mise
irm https://mise.run/powershell | iex

# Deploy this checkout
git clone https://github.com/t128n/dotfiles.git ~/Workspace/Repos/github.com/t128n/dotfiles
Set-Location ~/Workspace/Repos/github.com/t128n/dotfiles
mise trust
mise bootstrap
mise run workspace
mise run env
```

`mise bootstrap` installs the tools from `home/dot-config/mise/config.toml` and deploys every `[dotfiles]` entry, including your pwsh profile (`$PROFILE`) and Windows Terminal `settings.json`. `mise run workspace` creates `~/Workspace/{Repos,Resources,Scratch}`, ensures `~/.local/bin`, and puts it on your user `PATH`. `mise run env` copies the `[env]` values — `HOME` plus the Go, Rust, and Bun data and cache directories — into your user environment so editors and GUI apps resolve the same paths as an activated shell; re-run it after changing `[env]`, and use `mise run env:check` to detect drift. Put personal executables in `~/.local/bin`; `Resources` holds persistent reference material and `Scratch` is disposable. Restart pwsh, Windows Terminal, and any editors afterwards so the deployed mise config, profile, environment, and `PATH` changes take effect.

An existing `$PROFILE` or Terminal `settings.json` is replaced by the managed file; run `mise dot apply --force` if `mise bootstrap` reports the target as a conflict.

## Apps

Machine-level apps and system dependencies are declared per platform under `apps/`:

| Platform | Declaration | Applied with |
| --- | --- | --- |
| Windows | `apps/windows/winget.dsc.yaml` | `winget configure` |
| macOS | `apps/macos/Brewfile` | `brew bundle` |
| Linux | `apps/linux/<manager>.txt` | `apt-get`, `dnf`, or `pacman` |

Install them after `mise bootstrap`:

```sh
mise run apps
mise run apps:check
```

`mise run apps` installs what is missing and is safe to repeat; `mise run apps:check` reports missing apps without changing the machine. The declarations cover GUI apps, fonts, and machine-level libraries — CLI tools and language runtimes stay in `home/dot-config/mise/config.toml`. The app files are not deployed to `$HOME` and are not installed by `mise bootstrap`. WinGet can prompt for elevation once per run, macOS needs Homebrew, and Linux needs one of the supported package managers. See `apps/AGENTS.md` for inventory commands and conventions.

## Project templates

Templates live in `templates/` and are deployed to `~/.local/share/t128n-dotfiles/templates`. Create a project with:

```sh
mise run new minimal ~/Workspace/Scratch/my-app
mise run new rea-playground ~/Workspace/Scratch/rea-demo
```

The `minimal` template prompts for a project name and slug. `rea-playground` creates an isolated reverse-engineering workspace with a project-local `mise.toml` and OpenCode REA MCP server; creation also runs `mise trust` and `mise install`. Each template is a Copier template: `templates/<name>/copier.yml` plus `templates/<name>/template/`. Files ending in `.jinja` are rendered; other files are copied verbatim. See `templates/AGENTS.md` when adding a template.

## System configuration

`mise run system` runs the declarative system-state resources for the current OS and reports drift; add `--apply` to bring the machine to the declared state (and pass resource names to filter):

```sh
mise run system
mise run system --apply
```

Resources live in `scripts/system/resources/{common,<os>}/`. Each TypeScript module exports a `defineResource` object with `test`, `set`, and `unset`: removal resources ensure unwanted programs and configs stay absent, while setting resources enforce preferences such as taskbar, theme, cursors, and wallpaper. Resources can register deduplicated `onPostInstall` hooks (e.g. restarting Explorer once at the end). The scripts are deployed to `~/.local/share/t128n-dotfiles/scripts/system`.
