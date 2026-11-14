// Removes Firefox profiles, caches, Mozilla Maintenance Service, and shortcuts.
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

function getFirefoxPaths(): string[] {
  const appData = process.env.APPDATA || "";
  const localAppData = process.env.LOCALAPPDATA || "";
  const programData = process.env.ProgramData || "C:\\ProgramData";
  return [
    join(appData, "Mozilla"),
    join(localAppData, "Mozilla"),
    "C:\\Program Files\\Mozilla Firefox",
    "C:\\Program Files (x86)\\Mozilla Firefox",
    join(localAppData, "Programs", "Firefox"),
    "C:\\Program Files (x86)\\Mozilla Maintenance Service",
    join(programData, "Microsoft", "Windows", "Start Menu", "Programs", "Firefox Private Browsing.lnk"),
  ];
}

export default defineResource({
  async test() {
    if (await testWingetPackage("Mozilla.Firefox")) return false;
    for (const key of [
      "HKCU:\\Software\\Mozilla\\Firefox",
      "HKLM:\\Software\\Mozilla\\Firefox",
      "HKLM:\\Software\\Mozilla\\MaintenanceService",
      "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\firefox.exe",
    ]) {
      if (await regKeyExists(key)) return false;
    }
    for (const p of getFirefoxPaths()) {
      if (existsSync(p)) return false;
    }
    const svc = await runPwsh("if (Get-Service -Name MozillaMaintenance -ErrorAction SilentlyContinue) { 'exists' }");
    return svc.trim() !== "exists";
  },

  async set() {
    await runPwsh(`
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ExecutablePath -and ($_.ExecutablePath -like '*\\Mozilla Firefox\\*' -or $_.Name -eq 'firefox.exe') } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
`);

    for (const dir of [join(process.env.APPDATA || "", "Mozilla"), join(process.env.LOCALAPPDATA || "", "Mozilla")]) {
      await removePath(dir);
    }

    const installed = await testWingetPackage("Mozilla.Firefox");
    await invokeElevated(`
$ErrorActionPreference = 'Stop'
if ($${installed}) {
    winget uninstall --id Mozilla.Firefox --exact --silent --accept-source-agreements | Out-Null
}
$uninstaller = 'C:\\Program Files (x86)\\Mozilla Maintenance Service\\Uninstall.exe'
if (Test-Path -LiteralPath $uninstaller) {
    Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait
}
if (Get-Service -Name MozillaMaintenance -ErrorAction SilentlyContinue) {
    & sc.exe delete MozillaMaintenance | Out-Null
}
foreach ($key in @(
    'HKCU:\\Software\\Mozilla\\Firefox',
    'HKLM:\\Software\\Mozilla\\Firefox',
    'HKLM:\\Software\\Mozilla\\MaintenanceService',
    'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\firefox.exe'
)) {
    if (Test-Path -LiteralPath $key) { Remove-Item -LiteralPath $key -Recurse -Force }
}
foreach ($root in @(
    'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
)) {
    if (Test-Path -LiteralPath $root) {
        Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue |
            Where-Object { $_.PSChildName -like 'Mozilla*' } |
            Remove-Item -Recurse -Force
    }
}
foreach ($p in @(
    'C:\\Program Files\\Mozilla Firefox',
    'C:\\Program Files (x86)\\Mozilla Firefox',
    "$env:LOCALAPPDATA\\Programs\\Firefox",
    'C:\\Program Files (x86)\\Mozilla Maintenance Service',
    "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Firefox Private Browsing.lnk"
)) {
    if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force }
}
`);
  },
});
