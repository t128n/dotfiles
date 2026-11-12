# Managed by t128n/dotfiles: home/dot-config/powershell/Microsoft.PowerShell_profile.ps1

# mise Activation (tool shims, env vars, [shell_alias] definitions)
if (Get-Command mise -ErrorAction SilentlyContinue) {
    (&mise activate pwsh) | Out-String | Invoke-Expression
}

# Unicode & UTF-8 Fidelity
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding           = [System.Text.UTF8Encoding]::new()

# Performance & Noise Reduction
$env:POWERSHELL_TELEMETRY_OPTOUT = '1'
$env:POWERSHELL_UPDATECHECK       = 'Off'

# Dynamic Tab & Window Title
function Update-HostTitle {
    param([string]$Title)
    try {
        if (-not $Title) {
            $loc = (Get-Location).Path
            if ($loc.StartsWith($HOME, [System.StringComparison]::OrdinalIgnoreCase)) {
                $loc = "~" + $loc.Substring($HOME.Length)
            }
            $Title = "pwsh: $loc"
        }
        $Host.UI.RawUI.WindowTitle = $Title
    } catch {}
}

function global:Invoke-Starship-PreCommand {
    Update-HostTitle
}

# Modern PSReadLine Ergonomics (Fish-like autosuggestions & history search)
if (Get-Module -ListAvailable PSReadLine) {
    # Predictions need a console that supports virtual terminal processing.
    if (-not [Console]::IsOutputRedirected -and $Host.UI.SupportsVirtualTerminal) {
        Set-PSReadLineOption -PredictionSource HistoryAndPlugin
        Set-PSReadLineOption -PredictionViewStyle InlineView
    }
    Set-PSReadLineOption -BellStyle None
    Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
    Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward

    # Update tab title with currently running command
    Set-PSReadLineOption -AddToHistoryHandler {
        param($command)
        if (-not [string]::IsNullOrWhiteSpace($command)) {
            $firstLine = ($command.Trim() -split "`r?`n")[0]
            if ($firstLine.Length -gt 50) {
                $firstLine = $firstLine.Substring(0, 47) + "..."
            }
            Update-HostTitle $firstLine
        }
        return $true
    }

    # Interactive fzf file picker (Ctrl+T)
    if (Get-Command fzf -ErrorAction SilentlyContinue) {
        Set-PSReadLineKeyHandler -Chord 'Ctrl+t' -ScriptBlock {
            $selected = fd --type f --strip-cwd-prefix --hidden --exclude .git | fzf
            if ($selected) {
                [Microsoft.PowerShell.PSConsoleReadLine]::Insert($selected)
            }
        }
    }
}

# Cross-Shell Prompt (Starship)
if (Get-Command starship -ErrorAction SilentlyContinue) {
    Invoke-Expression (&starship init powershell)
} else {
    $originalPrompt = $function:prompt
    function global:prompt {
        Update-HostTitle
        if ($originalPrompt) { & $originalPrompt } else { "PS $($executionContext.SessionState.Path.CurrentLocation)$('>' * ($nestedPromptLevel + 1)) " }
    }
}

# Set initial tab title on profile load
Update-HostTitle

# Clean Aliases (PowerShell alias overrides for native CLIs)
if (Get-Alias curl -ErrorAction SilentlyContinue) { Remove-Item Alias:curl -Force }
if (Get-Alias wget -ErrorAction SilentlyContinue) { Remove-Item Alias:wget -Force }

# Per-machine overrides. Never commit this file.
$localProfile = Join-Path $HOME '.config/powershell/profile.local.ps1'
if (Test-Path $localProfile) { . $localProfile }
