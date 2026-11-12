# Cleanup item: taskbar position and multi-monitor window display
#
# Enforces a bottom taskbar and the "all taskbars" multi-monitor mode, where
# every display's taskbar shows every open window.

$StuckRectsKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StuckRects3'
$AdvancedKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'

# Offset 12 in the StuckRects3 Settings blob is the taskbar edge:
# 0 = left, 1 = top, 2 = right, 3 = bottom.
$Bottom = 3

function Get-TaskbarPosition {
    $settings = (Get-ItemProperty -Path $StuckRectsKey -Name Settings -ErrorAction SilentlyContinue).Settings
    if (-not $settings -or $settings.Length -le 12) { return $null }
    return [int]$settings[12]
}

function Set-TaskbarPosition {
    $settings = (Get-ItemProperty -Path $StuckRectsKey -Name Settings -ErrorAction SilentlyContinue).Settings
    if (-not $settings -or $settings.Length -le 12) {
        throw 'taskbar position registry value is missing'
    }

    $updated = [byte[]]$settings.Clone()
    $updated[12] = $Bottom
    Set-ItemProperty -Path $StuckRectsKey -Name Settings -Value $updated -Type Binary
}

function Test-AllTaskbars {
    $advanced = Get-ItemProperty -Path $AdvancedKey -ErrorAction SilentlyContinue
    return ($advanced.MMTaskbarEnabled -eq 1) -and ($advanced.MMTaskbarMode -eq 0)
}

function Test-CleanupItem {
    return ((Get-TaskbarPosition) -eq $Bottom) -and (Test-AllTaskbars)
}

function Set-CleanupItem {
    $changed = $false

    if ((Get-TaskbarPosition) -ne $Bottom) {
        Set-TaskbarPosition
        $changed = $true
    }

    if (-not (Test-AllTaskbars)) {
        Set-ItemProperty -Path $AdvancedKey -Name MMTaskbarEnabled -Value 1 -Type DWord
        Set-ItemProperty -Path $AdvancedKey -Name MMTaskbarMode -Value 0 -Type DWord
        $changed = $true
    }

    if ($changed) { Restart-Explorer }
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
