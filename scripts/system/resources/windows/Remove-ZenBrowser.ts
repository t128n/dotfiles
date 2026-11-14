// Removes Zen Browser WinGet package, profile/cache, install dir, and shortcuts.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineResource } from "../../lib/types.ts";
import {
  invokeElevated,
  regKeyExists,
  removePath,
  runPwsh,
  testWingetPackage,
} from "../../lib/windows.ts";

function getZenPaths(): string[] {
  const appData = process.env.APPDATA || "";
  const localAppData = process.env.LOCALAPPDATA || "";
  const programData = process.env.ProgramData || "C:\\ProgramData";
  return [
    join(appData, "zen"),
    join(localAppData, "zen"),
    "C:\\Program Files\\Zen Browser",
    join(programData, "Microsoft", "Windows", "Start Menu", "Programs", "Zen.lnk"),
    join(programData, "Microsoft", "Windows", "Start Menu", "Programs", "Zen Private Browsing.lnk"),
  ];
}

export default defineResource({
  async test() {
    if (await testWingetPackage("Zen-Team.Zen-Browser")) return false;
    if (await regKeyExists("HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Zen Browser")) return false;
    if (await regKeyExists("HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\zen.exe")) return false;

    const zenReg = await runPwsh(`
foreach ($root in @('HKLM:\\Software\\Mozilla', 'HKCU:\\Software\\Mozilla')) {
    if (Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -like 'Zen*' }) {
        'found'; break
    }
}
`);
    if (zenReg.trim() === "found") return false;
    return getZenPaths().every((p) => !existsSync(p));
  },

  async set() {
    await runPwsh(`
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ExecutablePath -and $_.ExecutablePath -like 'C:\\Program Files\\Zen Browser\\*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
`);

    for (const dir of [join(process.env.APPDATA || "", "zen"), join(process.env.LOCALAPPDATA || "", "zen")]) {
      await removePath(dir);
    }

    const installed = await testWingetPackage("Zen-Team.Zen-Browser");
    await invokeElevated(`
$ErrorActionPreference = 'Stop'
if ($${installed}) {
    winget uninstall --id Zen-Team.Zen-Browser --exact --silent --accept-source-agreements | Out-Null
}
foreach ($key in @(
    'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Zen Browser',
    'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\zen.exe'
)) {
    if (Test-Path -LiteralPath $key) { Remove-Item -LiteralPath $key -Recurse -Force }
}
foreach ($root in @('HKLM:\\Software\\Mozilla', 'HKCU:\\Software\\Mozilla')) {
    if (Test-Path -LiteralPath $root) {
        Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue |
            Where-Object { $_.PSChildName -like 'Zen*' } |
            Remove-Item -Recurse -Force
    }
}
foreach ($p in @(
    'C:\\Program Files\\Zen Browser',
    "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Zen.lnk",
    "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Zen Private Browsing.lnk"
)) {
    if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force }
}
`);
  },
});
