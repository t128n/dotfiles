# Managed by t128n/dotfiles: home/dot-config/powershell/Microsoft.PowerShell_profile.ps1

# Activate mise so tools from ~/.config/mise/config.toml are available per directory.
if (Get-Command mise -ErrorAction SilentlyContinue) {
    (&mise activate pwsh) | Out-String | Invoke-Expression
}

# PSReadLine: history-based predictions and Up/Down history search.
if (Get-Module -ListAvailable PSReadLine) {
    # Predictions need a console that supports virtual terminal processing.
    if (-not [Console]::IsOutputRedirected -and $Host.UI.SupportsVirtualTerminal) {
        Set-PSReadLineOption -PredictionSource History
    }
    Set-PSReadLineOption -HistorySearchCursorMovesToEnd
    Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
    Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
}

# Per-machine overrides. Never commit this file.
$localProfile = Join-Path $HOME '.config/powershell/profile.local.ps1'
if (Test-Path $localProfile) { . $localProfile }
