# Cleanup item: Zen Browser
#
# Removes the machine-wide WinGet package, the per-user profile and cache, the
# install directory, and Start Menu shortcuts. Machine-wide changes prompt for
# UAC.

function Get-ZenPaths {
    @(
        "$env:APPDATA\zen",
        "$env:LOCALAPPDATA\zen",
        'C:\Program Files\Zen Browser',
        "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Zen.lnk",
        "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Zen Private Browsing.lnk"
    )
}

function Test-CleanupItem {
    if (Test-WingetPackage 'Zen-Team.Zen-Browser') { return $false }
    if (Test-Path -LiteralPath 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Zen Browser') { return $false }
    if (Test-Path -LiteralPath 'HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\zen.exe') { return $false }
    foreach ($root in @('HKLM:\Software\Mozilla', 'HKCU:\Software\Mozilla')) {
        if (Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue |
                Where-Object { $_.PSChildName -like 'Zen*' }) { return $false }
    }
    foreach ($path in Get-ZenPaths) {
        if (Test-Path -LiteralPath $path) { return $false }
    }
    return $true
}

function Set-CleanupItem {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.ExecutablePath -and $_.ExecutablePath -like 'C:\Program Files\Zen Browser\*'
        } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    foreach ($path in @("$env:APPDATA\zen", "$env:LOCALAPPDATA\zen")) {
        Remove-CleanupPath $path
    }

    $installed = Test-WingetPackage 'Zen-Team.Zen-Browser'
    $command = @'
$ErrorActionPreference = 'Stop'
if (__INSTALLED__) {
    # The package registration can survive a broken install; clean the
    # leftovers below even when the uninstaller cannot run.
    winget uninstall --id Zen-Team.Zen-Browser --exact --silent --accept-source-agreements | Out-Null
}
foreach ($key in @(
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Zen Browser',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\zen.exe'
    )) {
    if (Test-Path -LiteralPath $key) { Remove-Item -LiteralPath $key -Recurse -Force }
}
foreach ($root in @('HKLM:\Software\Mozilla', 'HKCU:\Software\Mozilla')) {
    if (Test-Path -LiteralPath $root) {
        Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue |
            Where-Object { $_.PSChildName -like 'Zen*' } |
            Remove-Item -Recurse -Force
    }
}
foreach ($p in @(
        'C:\Program Files\Zen Browser',
        "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Zen.lnk",
        "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Zen Private Browsing.lnk"
    )) {
    if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force }
}
'@
    $command = $command.Replace('__INSTALLED__', $installed.ToString().ToLowerInvariant())
    Invoke-ElevatedCommand $command
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
