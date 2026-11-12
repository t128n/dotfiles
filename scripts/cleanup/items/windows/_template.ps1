# Cleanup item template for Windows. Copy to items/windows/<Verb>-<Thing>.ps1.
#
# Use an approved PowerShell verb in the file name, for example
# Remove-OpencodeDesktop.ps1 or Set-Taskbar.ps1.
#
# Contract (dot-sourced by windows.ps1, never run directly):
#   Test-CleanupItem   return $true when the item is already in the desired state
#   Set-CleanupItem    enforce the desired state; throw on failure
#   Unset-CleanupItem  optional restore hook; the item run never calls it
#
# Available helpers:
#   Test-WingetPackage ID, Remove-WingetPackage ID
#   Remove-CleanupPath PATH, Test-SafePath PATH
#   Test-Admin, Invoke-ElevatedCommand COMMAND (UAC prompt when needed)
#   Restart-Explorer (reload shell settings)
#
# Items are idempotent: absent items are skipped, and a repeated --apply run
# succeeds. Do not print routine output; the executor reports item names.

function Test-CleanupItem {
    # Return $true when the machine already matches, for example:
    # return -not (Test-WingetPackage 'Some.Package') -and
    #     -not (Test-Path -LiteralPath "$env:APPDATA\SomeApp")
    return $true
}

function Set-CleanupItem {
    # Enforce the desired state, for example:
    # Remove-WingetPackage 'Some.Package'
    # Remove-CleanupPath "$env:APPDATA\SomeApp"
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
