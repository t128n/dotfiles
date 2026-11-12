#!/usr/bin/env pwsh
# Install the apps declared in apps/windows/winget.dsc.yaml.
#
# Check without changing the machine:
#   pwsh -NoProfile -File scripts/apps/apply.ps1 -Check
#
# Apply:
#   pwsh -NoProfile -File scripts/apps/apply.ps1

param(
    [switch]$Check
)

$ErrorActionPreference = 'Stop'

# A native command exiting non-zero is not an error we want to trap here.
if (Test-Path variable:PSNativeCommandUseErrorActionPreference) {
    $PSNativeCommandUseErrorActionPreference = $false
}

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    [Console]::Error.WriteLine('apps: winget is not available; install App Installer from the Microsoft Store.')
    exit 1
}

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Config = Join-Path $Root 'apps\windows\winget.dsc.yaml'

if (-not (Test-Path -LiteralPath $Config -PathType Leaf)) {
    [Console]::Error.WriteLine("apps: configuration not found: $Config")
    exit 1
}

$Arguments = @('configure')
if ($Check) { $Arguments += 'test' }
$Arguments += @('-f', $Config, '--accept-configuration-agreements')

& winget @Arguments
exit $LASTEXITCODE
