// Removes Visual Studio Code (WinGet package, MSIX package, user data, and extensions).
import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineResource } from "../../lib/types.ts";
import {
  invokeElevated,
  removePath,
  removeWingetPackage,
  runPwsh,
  testWingetPackage,
} from "../../lib/windows.ts";

function getUserPaths(home: string): string[] {
  const appData = process.env.APPDATA || "";
  const localAppData = process.env.LOCALAPPDATA || "";
  return [
    join(localAppData, "Programs", "Microsoft VS Code"),
    join(appData, "Code"),
    join(home, ".vscode"),
    join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Visual Studio Code"),
  ];
}

const SYSTEM_INSTALL_DIR = "C:\\Program Files\\Microsoft VS Code";

async function hasMsixVSCode(): Promise<boolean> {
  const out = await runPwsh("if (Get-AppxPackage -Name 'Microsoft.VisualStudioCode*' -ErrorAction SilentlyContinue) { 'yes' }");
  return out.trim() === "yes";
}

export default defineResource({
  async test(ctx) {
    if (await testWingetPackage("Microsoft.VisualStudioCode")) return false;
    if (await hasMsixVSCode()) return false;
    if (existsSync(SYSTEM_INSTALL_DIR)) return false;
    return getUserPaths(ctx.home).every((p) => !existsSync(p));
  },

  async set(ctx) {
    await $`taskkill /F /IM Code.exe`.nothrow().quiet();

    if (await testWingetPackage("Microsoft.VisualStudioCode")) {
      await removeWingetPackage("Microsoft.VisualStudioCode");
    }

    if (await hasMsixVSCode()) {
      await runPwsh(`
Get-AppxPackage -Name 'Microsoft.VisualStudioCode*' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
`);
    }

    for (const p of getUserPaths(ctx.home)) {
      await removePath(p);
    }

    if (existsSync(SYSTEM_INSTALL_DIR)) {
      await invokeElevated(`
$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath '${SYSTEM_INSTALL_DIR}') {
    Remove-Item -LiteralPath '${SYSTEM_INSTALL_DIR}' -Recurse -Force
}
`);
    }
  },
});
