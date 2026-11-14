// Desktop wallpaper: ~/.local/share/t128n-dotfiles/wallpapers/Wallpaper.png
// with Fill style (10), applied immediately via SPI_SETDESKWALLPAPER.
import { existsSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { defineResource } from "../../lib/types.ts";
import {
  runPwsh,
  setRegistryTargets,
  testRegistryTargets,
  type RegistryTarget,
} from "../../lib/windows.ts";

const DESKTOP_KEY = "HKCU:\\Control Panel\\Desktop";

function getTargets(wallpaperPath: string): RegistryTarget[] {
  return [
    { path: DESKTOP_KEY, name: "WallPaper", value: wallpaperPath, type: "String" },
    { path: DESKTOP_KEY, name: "WallpaperStyle", value: "10", type: "String" },
    { path: DESKTOP_KEY, name: "TileWallpaper", value: "0", type: "String" },
  ];
}

function getTranscodedPath(): string {
  return join(process.env.APPDATA || "", "Microsoft", "Windows", "Themes", "TranscodedWallpaper");
}

export default defineResource({
  async test(ctx) {
    const wallpaperPath = join(ctx.home, ".local", "share", "t128n-dotfiles", "wallpapers", "Wallpaper.png");
    if (!existsSync(wallpaperPath)) return false;
    if (!(await testRegistryTargets(getTargets(wallpaperPath)))) return false;

    const transcodedPath = getTranscodedPath();
    if (!existsSync(transcodedPath) || statSync(transcodedPath).mtimeMs < statSync(wallpaperPath).mtimeMs) {
      return false;
    }
    return true;
  },

  async set(ctx) {
    const wallpaperPath = join(ctx.home, ".local", "share", "t128n-dotfiles", "wallpapers", "Wallpaper.png");
    if (!existsSync(wallpaperPath)) {
      throw new Error(`wallpaper file missing: ${wallpaperPath}; run mise dot apply first`);
    }

    await setRegistryTargets(getTargets(wallpaperPath));
    const transcodedPath = getTranscodedPath();
    if (existsSync(transcodedPath)) {
      rmSync(transcodedPath, { force: true });
    }
    const escaped = wallpaperPath.replace(/'/g, "''");
    await runPwsh(`
Add-Type -Namespace Win32 -Name WallpaperNative -MemberDefinition @'
    [System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode, SetLastError = true)]
    public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, string pvParam, uint fWinIni);
'@
if (-not [Win32.WallpaperNative]::SystemParametersInfo(0x0014, 0, '${escaped}', 0x03)) {
    throw 'SystemParametersInfo(SPI_SETDESKWALLPAPER) failed'
}
`);
  },
});
