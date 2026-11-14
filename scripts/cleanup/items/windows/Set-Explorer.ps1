# Cleanup item: File Explorer defaults
#
# Shows file extensions and hidden files, opens File Explorer to This PC, and
# enables compact mode.

$AdvancedKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'

$Targets = [ordered]@{
    HideFileExt    = 0
    Hidden         = 1
    LaunchTo       = 1
    UseCompactMode = 1
}

function Test-CleanupItem {
    $advanced = Get-ItemProperty -Path $AdvancedKey -ErrorAction SilentlyContinue
    if (-not $advanced) { return $false }

    foreach ($entry in $Targets.GetEnumerator()) {
        if ($advanced.($entry.Key) -ne $entry.Value) { return $false }
    }
    return $true
}

function Set-CleanupItem {
    $advanced = Get-ItemProperty -Path $AdvancedKey -ErrorAction SilentlyContinue
    $changed = $false

    foreach ($entry in $Targets.GetEnumerator()) {
        if (-not $advanced -or $advanced.($entry.Key) -ne $entry.Value) {
            Set-ItemProperty -Path $AdvancedKey -Name $entry.Key -Value $entry.Value -Type DWord
            $changed = $true
        }
    }

    if ($changed) { Restart-Explorer }
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
