#!/usr/bin/env bun
/**
 * Install or check the apps declared under apps/<os>/ for the current platform.
 *
 * Usage: bun scripts/apps/apply.ts [--check]
 */
import { $ } from "bun";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const check = args.includes("--check") || args.includes("-Check");
const unknown = args.filter((a) => a !== "--check" && a !== "-Check");
if (unknown.length > 0) {
  console.error(`apps: unknown argument(s): ${unknown.join(" ")}`);
  process.exit(2);
}

const root = resolve(import.meta.dir, "..", "..");

async function runWindows(): Promise<number> {
  if (!Bun.which("winget")) {
    console.error("apps: winget is not available; install App Installer from the Microsoft Store.");
    return 1;
  }

  const config = join(root, "apps", "windows", "winget.dsc.yaml");
  if (!existsSync(config)) {
    console.error(`apps: configuration not found: ${config}`);
    return 1;
  }

  const res = check
    ? await $`winget configure test -f ${config} --accept-configuration-agreements`.nothrow()
    : await $`winget configure -f ${config} --accept-configuration-agreements`.nothrow();
  return res.exitCode;
}

async function runMacos(): Promise<number> {
  const brewfile = join(root, "apps", "macos", "Brewfile");
  if (!Bun.which("brew")) {
    console.error(`apps: Homebrew is required to apply ${brewfile}`);
    return 1;
  }
  if (!existsSync(brewfile)) {
    console.error(`apps: ${brewfile} does not exist`);
    return 1;
  }

  const res = check
    ? await $`brew bundle check --file ${brewfile}`.nothrow()
    : await $`brew bundle install --file ${brewfile}`.nothrow();
  return res.exitCode;
}

type LinuxManager = "apt" | "dnf" | "pacman";

function detectLinuxManager(): LinuxManager | null {
  if (Bun.which("apt-get")) return "apt";
  if (Bun.which("dnf")) return "dnf";
  if (Bun.which("pacman")) return "pacman";
  return null;
}

async function isInstalledLinux(manager: LinuxManager, pkg: string): Promise<boolean> {
  switch (manager) {
    case "apt": {
      const res = await $`dpkg-query -W -f=${"${Status}"} ${pkg}`.nothrow().quiet();
      return res.exitCode === 0 && res.stdout.toString().includes("install ok installed");
    }
    case "dnf":
      return (await $`rpm -q ${pkg}`.nothrow().quiet()).exitCode === 0;
    case "pacman":
      return (await $`pacman -Q ${pkg}`.nothrow().quiet()).exitCode === 0;
  }
}

async function runLinux(): Promise<number> {
  const manager = detectLinuxManager();
  if (!manager) {
    console.error("apps: no supported package manager (apt, dnf, pacman)");
    return 1;
  }

  const file = join(root, "apps", "linux", `${manager}.txt`);
  if (!existsSync(file)) {
    console.log(`apps: no declarations for ${manager} (${file}); nothing to do`);
    return 0;
  }

  const content = await readFile(file, "utf8");
  const packages = content
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean);

  const missing: string[] = [];
  for (const pkg of packages) {
    if (!(await isInstalledLinux(manager, pkg))) {
      missing.push(pkg);
    }
  }

  if (missing.length === 0) {
    console.log(`apps: all ${manager} packages are installed`);
    return 0;
  }

  if (check) {
    console.log(`apps: missing (${manager}): ${missing.join(" ")}`);
    return 1;
  }

  console.log(`apps: installing (${manager}): ${missing.join(" ")}`);
  switch (manager) {
    case "apt": {
      const upd = await $`sudo apt-get update`.nothrow();
      if (upd.exitCode !== 0) return upd.exitCode;
      return (await $`sudo apt-get install -y ${missing}`.nothrow()).exitCode;
    }
    case "dnf":
      return (await $`sudo dnf install -y ${missing}`.nothrow()).exitCode;
    case "pacman":
      return (await $`sudo pacman -S --needed --noconfirm ${missing}`.nothrow()).exitCode;
  }
}

let code: number;
switch (process.platform) {
  case "win32":
    code = await runWindows();
    break;
  case "darwin":
    code = await runMacos();
    break;
  case "linux":
    code = await runLinux();
    break;
  default:
    console.error(`apps: unsupported platform: ${process.platform}`);
    code = 2;
}

process.exit(code);
