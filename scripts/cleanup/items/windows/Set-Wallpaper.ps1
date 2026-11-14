# Cleanup item: desktop wallpaper
#
# Sets the desktop wallpaper to ~/.local/share/t128n-dotfiles/wallpapers/Wallpaper.png
# with Fill style (10) and applies it immediately.

$DesktopKey = 'HKCU:\Control Panel\Desktop'
$WallpaperPath = Join-Path $env:USERPROFILE '.local\share\t128n-dotfiles\wallpapers\Wallpaper.png'
$WallpaperStyle = '10'
$TileWallpaper = '0'

function Test-CleanupItem {
    if (-not (Test-Path -LiteralPath $WallpaperPath)) { return $false }

    $props = Get-ItemProperty -Path $DesktopKey -ErrorAction SilentlyContinue
    if (-not $props) { return $false }

    return ($props.WallPaper -ceq $WallpaperPath) -and
        ($props.WallpaperStyle -ceq $WallpaperStyle) -and
        ($props.TileWallpaper -ceq $TileWallpaper)
}

function Set-WallpaperNative([string]$Path) {
    if (-not ('Win32.WallpaperNative' -as [type])) {
        Add-Type -Namespace Win32 -Name WallpaperNative -MemberDefinition @'
            [System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode, SetLastError = true)]
            public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, string pvParam, uint fWinIni);
'@
    }
    # SPI_SETDESKWALLPAPER (0x0014) with SPIF_UPDATEINIFILE | SPIF_SENDCHANGE (0x03).
    $ok = [Win32.WallpaperNative]::SystemParametersInfo(0x0014, 0, $Path, 0x03)
    if (-not $ok) {
        throw 'SystemParametersInfo(SPI_SETDESKWALLPAPER) failed'
    }
}

function Set-CleanupItem {
    if (-not (Test-Path -LiteralPath $WallpaperPath)) {
        throw "wallpaper file missing: $WallpaperPath; run mise dot apply first"
    }

    Set-ItemProperty -Path $DesktopKey -Name WallpaperStyle -Value $WallpaperStyle -Type String
    Set-ItemProperty -Path $DesktopKey -Name TileWallpaper -Value $TileWallpaper -Type String
    Set-ItemProperty -Path $DesktopKey -Name WallPaper -Value $WallpaperPath -Type String
    Set-WallpaperNative $WallpaperPath
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
