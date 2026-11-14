# Cleanup item: taskbar clock format and regional date/time display
#
# Enforces second precision on the taskbar clock, 24-hour time (HH:mm /
# HH:mm:ss), and ISO 8601 short dates (yyyy-MM-dd).

$AdvancedKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
$InternationalKey = 'HKCU:\Control Panel\International'

$Targets = @(
    @{ Path = $AdvancedKey; Name = 'ShowSecondsInSystemClock'; Value = 1; Type = 'DWord' },
    @{ Path = $InternationalKey; Name = 'sShortDate'; Value = 'yyyy-MM-dd'; Type = 'String' },
    @{ Path = $InternationalKey; Name = 'sShortTime'; Value = 'HH:mm'; Type = 'String' },
    @{ Path = $InternationalKey; Name = 'sTimeFormat'; Value = 'HH:mm:ss'; Type = 'String' },
    @{ Path = $InternationalKey; Name = 'iTime'; Value = '1'; Type = 'String' },
    @{ Path = $InternationalKey; Name = 'iTLZero'; Value = '1'; Type = 'String' },
    @{ Path = $InternationalKey; Name = 'iDate'; Value = '2'; Type = 'String' }
)

function Get-RegistryValue([string]$Path, [string]$Name) {
    return (Get-ItemProperty -Path $Path -Name $Name -ErrorAction SilentlyContinue).$Name
}

function Test-TargetValue($Target) {
    $current = Get-RegistryValue $Target.Path $Target.Name
    if ($Target.Type -eq 'String') {
        return ($current -is [string]) -and ($current -ceq $Target.Value)
    }
    return $current -eq $Target.Value
}

function Test-CleanupItem {
    foreach ($target in $Targets) {
        if (-not (Test-TargetValue $target)) { return $false }
    }
    return $true
}

function Set-CleanupItem {
    $changed = $false
    foreach ($target in $Targets) {
        if (-not (Test-TargetValue $target)) {
            if (-not (Test-Path -LiteralPath $target.Path)) {
                New-Item -Path $target.Path -Force | Out-Null
            }
            Set-ItemProperty -Path $target.Path -Name $target.Name -Value $target.Value -Type $target.Type
            $changed = $true
        }
    }

    if ($changed) { Restart-Explorer }
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
