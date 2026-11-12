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
```

`mise bootstrap` installs the tools from `home/dot-config/mise/config.toml` and deploys every `[dotfiles]` entry, including your pwsh profile (`$PROFILE`) and Windows Terminal `settings.json`. `mise run workspace` creates `~/Workspace/{Repos,Scratch,Bin}` and adds `~/Workspace/Bin` to your user `PATH`. Restart pwsh and Windows Terminal afterwards so the deployed mise config, profile, and `PATH` change take effect.

An existing `$PROFILE` or Terminal `settings.json` is replaced by the managed file; run `mise dot apply --force` if `mise bootstrap` reports the target as a conflict.
