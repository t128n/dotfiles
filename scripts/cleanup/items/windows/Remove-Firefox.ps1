# Cleanup item: Firefox
#
# Removes Firefox profiles and caches, the leftover Mozilla Maintenance Service,
# and Start Menu shortcuts. The Firefox application is already uninstalled on
# this machine, but the item also handles it if it returns.

function Get-FirefoxPaths {
    @(
        "$env:APPDATA\Mozilla",
        "$env:LOCALAPPDATA\Mozilla",
        'C:\Program Files\Mozilla Firefox',
        'C:\Program Files (x86)\Mozilla Firefox',
        "$env:LOCALAPPDATA\Programs\Firefox",
        'C:\Program Files (x86)\Mozilla Maintenance Service',
        "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Firefox Private Browsing.lnk"
    )
}

function Test-CleanupItem {
    if (Test-WingetPackage 'Mozilla.Firefox') { return $false }
    if (Test-Path -LiteralPath 'HKCU:\Software\Mozilla\Firefox') { return $false }
    if (Test-Path -LiteralPath 'HKLM:\Software\Mozilla\Firefox') { return $false }
    if (Test-Path -LiteralPath 'HKLM:\Software\Mozilla\MaintenanceService') { return $false }
    if (Test-Path -LiteralPath 'HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\firefox.exe') { return $false }
    foreach ($path in Get-FirefoxPaths) {
        if (Test-Path -LiteralPath $path) { return $false }
    }
    if (Get-Service -Name MozillaMaintenance -ErrorAction SilentlyContinue) { return $false }
    return $true
}

function Set-CleanupItem {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.ExecutablePath -and (
                $_.ExecutablePath -like '*\Mozilla Firefox\*' -or
                $_.Name -eq 'firefox.exe'
            )
        } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    foreach ($path in @("$env:APPDATA\Mozilla", "$env:LOCALAPPDATA\Mozilla")) {
        Remove-CleanupPath $path
    }

    $command = @'
$ErrorActionPreference = 'Stop'
if (__INSTALLED__) {
    winget uninstall --id Mozilla.Firefox --exact --silent --accept-source-agreements | Out-Null
}
$uninstaller = 'C:\Program Files (x86)\Mozilla Maintenance Service\Uninstall.exe'
if (Test-Path -LiteralPath $uninstaller) {
    Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait
}
$service = Get-Service -Name MozillaMaintenance -ErrorAction SilentlyContinue
if ($service) {
    & sc.exe delete MozillaMaintenance | Out-Null
}
foreach ($key in @(
        'HKCU:\Software\Mozilla\Firefox',
        'HKLM:\Software\Mozilla\Firefox',
        'HKLM:\Software\Mozilla\MaintenanceService',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\firefox.exe'
    )) {
    if (Test-Path -LiteralPath $key) { Remove-Item -LiteralPath $key -Recurse -Force }
}
foreach ($root in @(
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall'
    )) {
    if (Test-Path -LiteralPath $root) {
        Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue |
            Where-Object { $_.PSChildName -like 'Mozilla*' } |
            Remove-Item -Recurse -Force
    }
}
foreach ($p in @(
        'C:\Program Files\Mozilla Firefox',
        'C:\Program Files (x86)\Mozilla Firefox',
        "$env:LOCALAPPDATA\Programs\Firefox",
        'C:\Program Files (x86)\Mozilla Maintenance Service',
        "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Firefox Private Browsing.lnk"
    )) {
    if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force }
}
'@
    $command = $command.Replace('__INSTALLED__', (Test-WingetPackage 'Mozilla.Firefox').ToString().ToLowerInvariant())
    Invoke-ElevatedCommand $command
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
