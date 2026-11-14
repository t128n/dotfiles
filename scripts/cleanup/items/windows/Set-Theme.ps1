# Cleanup item: Windows theme and transparency
#
# Keeps the Windows shell dark and disables transparency and accent-colored
# surfaces. AppsUseLightTheme is intentionally left unmanaged so PowerToys
# Light Switch controls app theme scheduling.

$PersonalizeKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize'

$Targets = [ordered]@{
    SystemUsesLightTheme = 0
    EnableTransparency   = 0
    ColorPrevalence      = 0
}

function Test-CleanupItem {
    $props = Get-ItemProperty -Path $PersonalizeKey -ErrorAction SilentlyContinue
    if (-not $props) { return $false }

    foreach ($entry in $Targets.GetEnumerator()) {
        if ($props.($entry.Key) -ne $entry.Value) { return $false }
    }
    return $true
}

function Set-CleanupItem {
    if (-not (Test-Path -LiteralPath $PersonalizeKey)) {
        New-Item -Path $PersonalizeKey -Force | Out-Null
    }

    $props = Get-ItemProperty -Path $PersonalizeKey -ErrorAction SilentlyContinue
    $changed = $false

    foreach ($entry in $Targets.GetEnumerator()) {
        if (-not $props -or $props.($entry.Key) -ne $entry.Value) {
            Set-ItemProperty -Path $PersonalizeKey -Name $entry.Key -Value $entry.Value -Type DWord
            $changed = $true
        }
    }

    if ($changed) { Restart-Explorer }
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
