# Cleanup item: Start menu layout and promotions
#
# Start opens on the All apps list: Pinned and Recent are hidden while All stays
# visible, and All apps uses the grid view. Also hides the mobile-device entry,
# tips and app recommendations, and account notifications.

$StartKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Start'
$AdvancedKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
$PhoneCompanion = Join-Path $StartKey 'Companions\Microsoft.YourPhone_8wekyb3d8bbwe'

function Get-StartValue([string]$Path, [string]$Name) {
    return (Get-ItemProperty -Path $Path -Name $Name -ErrorAction SilentlyContinue).$Name
}

function Test-CleanupItem {
    if ((Get-StartValue $StartKey 'ShowPinnedSection') -ne 0) { return $false }
    if ((Get-StartValue $StartKey 'ShowRecentSection') -ne 0) { return $false }
    if ((Get-StartValue $StartKey 'ShowAllAppsSection') -ne 1) { return $false }
    # 0 = Category, 1 = Grid, 2 = List.
    if ((Get-StartValue $StartKey 'AllAppsViewMode') -ne 1) { return $false }
    if ((Get-StartValue $AdvancedKey 'Start_IrisRecommendations') -ne 0) { return $false }
    if ((Get-StartValue $AdvancedKey 'Start_AccountNotifications') -ne 0) { return $false }
    if ((Get-StartValue $AdvancedKey 'Start_TrackProgs') -ne 0) { return $false }

    if (Test-Path -LiteralPath $PhoneCompanion) {
        if ((Get-StartValue $PhoneCompanion 'IsEnabled') -ne 0) { return $false }
    }

    return $true
}

function Set-CleanupItem {
    $targets = @(
        @{ Path = $StartKey; Name = 'ShowPinnedSection'; Value = 0 },
        @{ Path = $StartKey; Name = 'ShowRecentSection'; Value = 0 },
        @{ Path = $StartKey; Name = 'ShowAllAppsSection'; Value = 1 },
        @{ Path = $StartKey; Name = 'AllAppsViewMode'; Value = 1 },
        @{ Path = $AdvancedKey; Name = 'Start_IrisRecommendations'; Value = 0 },
        @{ Path = $AdvancedKey; Name = 'Start_AccountNotifications'; Value = 0 },
        @{ Path = $AdvancedKey; Name = 'Start_TrackProgs'; Value = 0 }
    )
    if (Test-Path -LiteralPath $PhoneCompanion) {
        $targets += @{ Path = $PhoneCompanion; Name = 'IsEnabled'; Value = 0 }
    }

    $changed = $false
    foreach ($target in $targets) {
        if ((Get-StartValue $target.Path $target.Name) -ne $target.Value) {
            Set-ItemProperty -Path $target.Path -Name $target.Name -Value $target.Value -Type DWord
            $changed = $true
        }
    }

    if ($changed) { Restart-Explorer }
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
