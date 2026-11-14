# Cleanup item: keyboard repeat rate and mouse pointer acceleration
#
# Sets shortest keyboard repeat delay (0), fastest repeat rate (31), and
# disables mouse pointer acceleration ("Enhance pointer precision").

$KeyboardKey = 'HKCU:\Control Panel\Keyboard'
$MouseKey = 'HKCU:\Control Panel\Mouse'

$Targets = @(
    @{ Path = $KeyboardKey; Name = 'KeyboardDelay'; Value = '0' },
    @{ Path = $KeyboardKey; Name = 'KeyboardSpeed'; Value = '31' },
    @{ Path = $MouseKey; Name = 'MouseSpeed'; Value = '0' },
    @{ Path = $MouseKey; Name = 'MouseThreshold1'; Value = '0' },
    @{ Path = $MouseKey; Name = 'MouseThreshold2'; Value = '0' }
)

function Test-CleanupItem {
    foreach ($target in $Targets) {
        $val = (Get-ItemProperty -Path $target.Path -Name $target.Name -ErrorAction SilentlyContinue).($target.Name)
        if ($val -cne $target.Value) { return $false }
    }
    return $true
}

function Set-CleanupItem {
    foreach ($target in $Targets) {
        $val = (Get-ItemProperty -Path $target.Path -Name $target.Name -ErrorAction SilentlyContinue).($target.Name)
        if ($val -cne $target.Value) {
            Set-ItemProperty -Path $target.Path -Name $target.Name -Value $target.Value -Type String
        }
    }
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
