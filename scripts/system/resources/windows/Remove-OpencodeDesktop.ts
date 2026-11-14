// Removes OpenCode Desktop WinGet package, per-user app data, and updater caches.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineResource } from "../../lib/types.ts";
import {
  removePath,
  removeWingetPackage,
  runPwsh,
  testWingetPackage,
} from "../../lib/windows.ts";

function getOpencodePaths(): string[] {
  const appData = process.env.APPDATA || "";
  const localAppData = process.env.LOCALAPPDATA || "";
  return [
    join(appData, "ai.opencode.desktop"),
    join(localAppData, "@opencode-aidesktop-updater"),
    join(localAppData, "@opencodedesktop-updater"),
    join(localAppData, "Programs", "@opencode-aidesktop"),
  ];
}

export default defineResource({
  async test() {
    if (await testWingetPackage("Anomaly.OpenCode.Desktop")) return false;
    return getOpencodePaths().every((p) => !existsSync(p));
  },

  async set() {
    await runPwsh(`
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ExecutablePath -and (
            $_.ExecutablePath -like "$env:APPDATA\\ai.opencode.desktop\\*" -or
            $_.ExecutablePath -like "$env:LOCALAPPDATA\\Programs\\@opencode-aidesktop\\*"
        )
    } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
`);
    await removeWingetPackage("Anomaly.OpenCode.Desktop");
    for (const p of getOpencodePaths()) {
      await removePath(p);
    }
  },
});
