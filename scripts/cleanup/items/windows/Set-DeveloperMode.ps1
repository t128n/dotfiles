# Cleanup item: Windows Developer Mode and Win32 long paths
#
# Enables Developer Mode (AllowDevelopmentWithoutDevLicense = 1, needed for
# unprivileged symlinks) and Win32 long paths (LongPathsEnabled = 1).

$AppModelKey = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock'
$FileSystemKey = 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem'

function Test-CleanupItem {
    $devMode = (Get-ItemProperty -Path $AppModelKey -Name AllowDevelopmentWithoutDevLicense -ErrorAction SilentlyContinue).AllowDevelopmentWithoutDevLicense
    $longPaths = (Get-ItemProperty -Path $FileSystemKey -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled
    return ($devMode -eq 1) -and ($longPaths -eq 1)
}

function Set-CleanupItem {
    Invoke-ElevatedCommand @'
$ErrorActionPreference = 'Stop'
$appModel = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock'
if (-not (Test-Path -LiteralPath $appModel)) {
    New-Item -Path $appModel -Force | Out-Null
}
Set-ItemProperty -Path $appModel -Name AllowDevelopmentWithoutDevLicense -Value 1 -Type DWord
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -Value 1 -Type DWord
'@
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
