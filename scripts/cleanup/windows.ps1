#!/usr/bin/env pwsh
# Execute the Windows cleanup items under items/windows.
#
# Each item is a dot-sourced file exposing Test-CleanupItem, Set-CleanupItem,
# and Unset-CleanupItem. Dry-run by default; pass --apply (or -Apply) to remove.

$ErrorActionPreference = 'Stop'

# A native command exiting non-zero is not an error we want to trap here.
if (Test-Path variable:PSNativeCommandUseErrorActionPreference) {
    $PSNativeCommandUseErrorActionPreference = $false
}

$Apply = $args -contains '--apply' -or $args -contains '-Apply'
$Unknown = @($args | Where-Object { $_ -ne '--apply' -and $_ -ne '-Apply' })
if ($Unknown.Count -gt 0) {
    [Console]::Error.WriteLine("cleanup: unknown argument(s): $($Unknown -join ' ')")
    exit 2
}

$ItemsDir = Join-Path $PSScriptRoot 'items\windows'

$script:Changed = 0
$script:Absent = 0
$script:Failed = 0

function Say([string]$Message) {
    Write-Output $Message
}

# Return success only when $Path is safe to delete recursively. Rejects drive
# roots, the user/system directories themselves, and parent traversal.
function Test-SafePath([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
    if (-not [IO.Path]::IsPathRooted($Path)) { return $false }
    # Reject drive-relative paths such as C: and C:foo, which resolve against
    # the current directory.
    if ($Path -match '^[A-Za-z]:(?![\\/])') { return $false }

    try {
        $full = [IO.Path]::GetFullPath($Path)
    } catch {
        return $false
    }

    if ($full -match '(^|[\\/])\.\.([\\/]|$)') { return $false }

    # Check the root before trimming: C:\ must not become the drive-relative C:.
    $root = [IO.Path]::GetPathRoot($full)
    if ($full -eq $root) { return $false }
    $full = $full.TrimEnd('\', '/')

    $protected = @(
        $env:USERPROFILE,
        $env:APPDATA,
        $env:LOCALAPPDATA,
        $env:SystemRoot,
        $env:ProgramFiles,
        ${env:ProgramFiles(x86)},
        $env:ProgramData
    )
    if ($env:USERPROFILE) {
        $protected += Split-Path -Path $env:USERPROFILE -Parent
    }

    foreach ($candidate in $protected) {
        if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
        $candidate = [IO.Path]::GetFullPath($candidate).TrimEnd('\', '/')
        if ($full -eq $candidate) { return $false }
    }

    return $true
}

# Remove-CleanupPath PATH
#
# Delete PATH recursively after validating it. Items call this from
# Set-CleanupItem.
function Remove-CleanupPath([string]$Path) {
    if (-not (Test-SafePath $Path)) {
        throw "refusing unsafe path: $Path"
    }
    if (-not (Test-Path -LiteralPath $Path)) { return }
    Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
}

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    return ([Security.Principal.WindowsPrincipal]$identity).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Run a self-contained PowerShell command with admin rights, prompting for UAC
# when the current session is not elevated.
function Invoke-ElevatedCommand([string]$Command) {
    if (Test-Admin) {
        Invoke-Expression $Command
        return
    }

    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
    # Elevate Windows PowerShell: a Store-installed pwsh lives under WindowsApps,
    # which Start-Process cannot launch with -Verb RunAs.
    $powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $process = Start-Process -FilePath $powershell -Verb RunAs -Wait -PassThru -ArgumentList @(
        '-NoProfile', '-EncodedCommand', $encoded)
    if ($process.ExitCode -ne 0) {
        throw "elevated command failed (exit $($process.ExitCode))"
    }
}

# Restart Explorer so shell settings take effect. Windows normally restarts it
# automatically; start it explicitly if auto-restart is disabled.
function Restart-Explorer {
    if (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue)) { return }

    Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
    $deadline = (Get-Date).AddSeconds(5)
    while (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 200
    }
    if (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue)) {
        Start-Process explorer.exe
    }
}

function Test-WingetPackage([string]$Id) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw 'winget is not available; install App Installer from the Microsoft Store'
    }

    $output = & winget list --id $Id --exact --accept-source-agreements 2>$null
    if ($LASTEXITCODE -ne 0) { return $false }
    return [bool]($output | Where-Object { $_ -and $_.Contains($Id, [StringComparison]::OrdinalIgnoreCase) })
}

function Remove-WingetPackage([string]$Id) {
    if (-not (Test-WingetPackage $Id)) { return }

    $output = & winget uninstall --id $Id --exact --silent --accept-source-agreements 2>&1
    if ($LASTEXITCODE -ne 0) {
        $detail = if ($output) { "`n$($output -join "`n")" } else { '' }
        throw "failed to uninstall (package) $Id$detail"
    }
}

$Items = @(Get-ChildItem -LiteralPath $ItemsDir -Filter '*.ps1' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike '_*' } |
    Sort-Object Name)

if ($Items.Count -eq 0) {
    Say 'No cleanup items configured in items/windows.'
    exit 0
}

foreach ($Item in $Items) {
    $Name = $Item.BaseName
    $State = $null

    try {
        # Run each item in its own scope so its helpers do not leak into the
        # next item.
        $State = & {
            param($Path)

            . $Path

            foreach ($fn in 'Test-CleanupItem', 'Set-CleanupItem', 'Unset-CleanupItem') {
                if (-not (Get-Command $fn -CommandType Function -ErrorAction SilentlyContinue)) {
                    throw "missing $fn()"
                }
            }

            if (Test-CleanupItem) { return 'ok' }
            if (-not $Apply) { return 'pending' }

            $null = Set-CleanupItem
            return 'applied'
        } $Item.FullName
    } catch {
        Write-Warning "cleanup: ${Name}: $($_.Exception.Message)"
        $script:Failed++
        continue
    }

    switch ($State) {
        'ok' { Say "ok           $Name"; $script:Absent++ }
        'pending' { Say "pending      $Name"; $script:Changed++ }
        'applied' { Say "applied      $Name"; $script:Changed++ }
    }
}

Say ''
if ($Apply) {
    Say "Applied $Changed item(s); $Absent already ok; $Failed failed."
} else {
    Say "$Changed item(s) pending; $Absent already ok; $Failed failed."
    Say 'Re-run with --apply to apply them.'
}

if ($Failed -gt 0) { exit 1 }
