// Removes GitHub Copilot (Windows Copilot Appx/WinGet), GitHub Copilot CLI
// (mise tool, gh extension), and leftover Copilot config/cache directories.
import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineResource } from "../../lib/types.ts";
import {
  removePath,
  removeWingetPackage,
  runPwsh,
  testWingetPackage,
} from "../../lib/windows.ts";

function getCopilotPaths(home: string): string[] {
  const appData = process.env.APPDATA || "";
  const localAppData = process.env.LOCALAPPDATA || "";
  return [
    join(home, ".copilot"),
    join(localAppData, "copilot"),
    join(appData, "copilot"),
    join(localAppData, "GitHub Copilot"),
    join(appData, "GitHub Copilot"),
  ];
}

async function hasAppxCopilot(): Promise<boolean> {
  const out = await runPwsh("if (Get-AppxPackage -Name '*Copilot*' -ErrorAction SilentlyContinue) { 'yes' }");
  return out.trim() === "yes";
}

async function hasMiseCopilot(): Promise<boolean> {
  if (!Bun.which("mise")) return false;
  const res = await $`mise ls --installed copilot`.nothrow().quiet();
  return res.exitCode === 0 && res.stdout.toString().trim().length > 0;
}

async function hasGhCopilotExtension(): Promise<boolean> {
  if (!Bun.which("gh")) return false;
  const res = await $`gh extension list`.nothrow().quiet();
  if (res.exitCode !== 0) return false;
  return res.stdout.toString().toLowerCase().includes("gh-copilot");
}

export default defineResource({
  async test(ctx) {
    if (await testWingetPackage("GitHub.Copilot")) return false;
    if (await testWingetPackage("Microsoft.Copilot")) return false;
    if (await hasAppxCopilot()) return false;
    if (await hasMiseCopilot()) return false;
    if (await hasGhCopilotExtension()) return false;
    return getCopilotPaths(ctx.home).every((p) => !existsSync(p));
  },

  async set(ctx) {
    await runPwsh(`
Get-Process -Name 'copilot*' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
`);

    if (await testWingetPackage("GitHub.Copilot")) {
      await removeWingetPackage("GitHub.Copilot");
    }
    if (await testWingetPackage("Microsoft.Copilot")) {
      await removeWingetPackage("Microsoft.Copilot");
    }

    if (await hasAppxCopilot()) {
      await runPwsh(`
Get-AppxPackage -Name '*Copilot*' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
`);
    }

    if (await hasMiseCopilot()) {
      const res = await $`mise uninstall copilot`.nothrow().quiet();
      if (res.exitCode !== 0) {
        throw new Error(`failed to uninstall mise tool copilot: ${res.stderr.toString().trim()}`);
      }
      await $`mise reshim`.nothrow().quiet();
    }

    if (await hasGhCopilotExtension()) {
      await $`gh extension remove copilot`.nothrow().quiet();
    }

    for (const p of getCopilotPaths(ctx.home)) {
      await removePath(p);
    }
  },
});
