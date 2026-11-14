# Cleanup item: Windows mouse cursor scheme
#
# Applies the Bibata-Modern-Classic-Regular cursor scheme from
# ~/.local/share/t128n-dotfiles/cursors and reloads the system cursors.

$CursorsKey = 'HKCU:\Control Panel\Cursors'
$SchemesKey = 'HKCU:\Control Panel\Cursors\Schemes'
$SchemeName = 'Bibata-Modern-Classic-Regular'
$CursorDir = Join-Path $env:USERPROFILE '.local\share\t128n-dotfiles\cursors\Bibata-Modern-Classic-Regular'

$CursorMap = [ordered]@{
    Arrow         = 'Pointer.cur'
    Help          = 'Help.cur'
    AppStarting   = 'Work.ani'
    Wait          = 'Busy.ani'
    Crosshair     = 'Cross.cur'
    PrecisionHair = 'Cross.cur'
    IBeam         = 'Text.cur'
    NWPen         = 'Handwriting.cur'
    No            = 'Unavailable.cur'
    SizeNS        = 'Vert.cur'
    SizeWE        = 'Horz.cur'
    SizeNWSE      = 'Dgn1.cur'
    SizeNESW      = 'Dgn2.cur'
    Grab          = 'Move.cur'
    SizeAll       = 'Move.cur'
    UpArrow       = 'Alternate.cur'
    Hand          = 'Link.cur'
    Pin           = 'Pin.cur'
    Person        = 'Person.cur'
    Pan           = 'Pan.cur'
    Grabbing      = 'Grabbing.cur'
    'Zoom-in'     = 'Zoom-in.cur'
    'Zoom-out'    = 'Zoom-out.cur'
}

$SchemeOrder = @(
    'Pointer.cur', 'Help.cur', 'Work.ani', 'Busy.ani', 'Cross.cur', 'Text.cur',
    'Handwriting.cur', 'Unavailable.cur', 'Vert.cur', 'Horz.cur', 'Dgn1.cur',
    'Dgn2.cur', 'Move.cur', 'Alternate.cur', 'Link.cur', 'Pin.cur', 'Person.cur',
    'Pan.cur', 'Grabbing.cur', 'Zoom-in.cur', 'Zoom-out.cur'
)

function Get-SchemeValue {
    return ($SchemeOrder | ForEach-Object { Join-Path $CursorDir $_ }) -join ','
}

function Test-CleanupItem {
    if (-not (Test-Path -LiteralPath $CursorDir)) { return $false }

    $props = Get-ItemProperty -Path $CursorsKey -ErrorAction SilentlyContinue
    if (-not $props) { return $false }
    if ($props.'(default)' -cne $SchemeName) { return $false }
    if ($props.'Scheme Source' -ne 1) { return $false }

    foreach ($entry in $CursorMap.GetEnumerator()) {
        $expected = Join-Path $CursorDir $entry.Value
        if ($props.($entry.Key) -cne $expected) { return $false }
    }

    $schemes = Get-ItemProperty -Path $SchemesKey -Name $SchemeName -ErrorAction SilentlyContinue
    if (-not $schemes -or $schemes.$SchemeName -cne (Get-SchemeValue)) { return $false }

    return $true
}

function Update-SystemCursors {
    if (-not ('Win32.CursorNative' -as [type])) {
        Add-Type -Namespace Win32 -Name CursorNative -MemberDefinition @'
            [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true)]
            public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, System.IntPtr pvParam, uint fWinIni);
'@
    }
    # SPI_SETCURSORS (0x0057) with SPIF_SENDCHANGE (0x02).
    # SPIF_UPDATEINIFILE (0x01) causes SPI_SETCURSORS to return false.
    $ok = [Win32.CursorNative]::SystemParametersInfo(0x0057, 0, [IntPtr]::Zero, 0x02)
    if (-not $ok) {
        throw 'SystemParametersInfo(SPI_SETCURSORS) failed'
    }
}

function Set-CleanupItem {
    if (-not (Test-Path -LiteralPath $CursorDir)) {
        throw "cursor directory missing: $CursorDir; run mise dot apply first"
    }
    foreach ($file in $SchemeOrder) {
        $fullPath = Join-Path $CursorDir $file
        if (-not (Test-Path -LiteralPath $fullPath)) {
            throw "cursor file missing: $fullPath"
        }
    }

    if (-not (Test-Path -LiteralPath $SchemesKey)) {
        New-Item -Path $SchemesKey -Force | Out-Null
    }

    Set-ItemProperty -Path $CursorsKey -Name '(default)' -Value $SchemeName -Type String
    Set-ItemProperty -Path $CursorsKey -Name 'Scheme Source' -Value 1 -Type DWord

    foreach ($entry in $CursorMap.GetEnumerator()) {
        $path = Join-Path $CursorDir $entry.Value
        Set-ItemProperty -Path $CursorsKey -Name $entry.Key -Value $path -Type String
    }

    Set-ItemProperty -Path $SchemesKey -Name $SchemeName -Value (Get-SchemeValue) -Type String
    Update-SystemCursors
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
