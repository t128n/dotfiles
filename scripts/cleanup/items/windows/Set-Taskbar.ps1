# Cleanup item: taskbar position, multi-monitor display, and declutter
#
# Enforces a bottom, left-aligned taskbar with "all taskbars" multi-monitor
# mode and hides Widgets, Chat, Task View, and Copilot buttons.

$StuckRectsKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StuckRects3'
$AdvancedKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'

# Offset 12 in the StuckRects3 Settings blob is the taskbar edge:
# 0 = left, 1 = top, 2 = right, 3 = bottom.
$Bottom = 3

$AdvancedTargets = [ordered]@{
    MMTaskbarEnabled   = 1
    MMTaskbarMode      = 0
    TaskbarAl          = 0
    TaskbarDa          = 0
    TaskbarMn          = 0
    ShowTaskViewButton = 0
    ShowCopilotButton  = 0
}

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

function Test-AdvancedTaskbar {
    $advanced = Get-ItemProperty -Path $AdvancedKey -ErrorAction SilentlyContinue
    if (-not $advanced) { return $false }
    foreach ($entry in $AdvancedTargets.GetEnumerator()) {
        if ($advanced.($entry.Key) -ne $entry.Value) { return $false }
    }
    return $true
}

function Test-CleanupItem {
    return ((Get-TaskbarPosition) -eq $Bottom) -and (Test-AdvancedTaskbar)
}

function Set-CleanupItem {
    $changed = $false

    if ((Get-TaskbarPosition) -ne $Bottom) {
        Set-TaskbarPosition
        $changed = $true
    }

    $advanced = Get-ItemProperty -Path $AdvancedKey -ErrorAction SilentlyContinue
    foreach ($entry in $AdvancedTargets.GetEnumerator()) {
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
