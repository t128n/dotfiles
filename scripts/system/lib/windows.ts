import { $ } from "bun";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, parse, resolve } from "node:path";
import type { ResourceContext } from "./types.ts";

export interface RegistryTarget {
  path: string;
  name: string;
  value: string | number;
  type: "String" | "DWord";
}

function toRegExePath(psPath: string): string {
  return psPath.replace(/^HKCU:\\/i, "HKCU\\").replace(/^HKLM:\\/i, "HKLM\\");
}

function encodePowerShellCommand(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

function getPowershellExe(): string {
  return Bun.which("pwsh") ?? "powershell.exe";
}

export async function runPwsh(script: string): Promise<string> {
  const exe = getPowershellExe();
  const encoded = encodePowerShellCommand(script);
  const result = await $`${exe} -NoProfile -NonInteractive -EncodedCommand ${encoded}`.nothrow().quiet();
  if (result.exitCode !== 0) {
    const err = result.stderr.toString().trim() || result.stdout.toString().trim();
    throw new Error(err || `PowerShell exited with code ${result.exitCode}`);
  }
  return result.stdout.toString();
}

export async function invokeElevated(script: string): Promise<void> {
  const escaped = script.replace(/'/g, "''");
  const wrapper = `
$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$isAdmin = ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$cmd = '${escaped}'
if ($isAdmin) {
    Invoke-Expression $cmd
    return
}
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
$ps = Join-Path $env:SystemRoot 'System32\\WindowsPowerShell\\v1.0\\powershell.exe'
$proc = Start-Process -FilePath $ps -Verb RunAs -Wait -PassThru -ArgumentList @('-NoProfile', '-EncodedCommand', $encoded)
if ($proc.ExitCode -ne 0) {
    throw "elevated command failed (exit $($proc.ExitCode))"
}
`;
  await runPwsh(wrapper);
}

export async function regKeyExists(path: string): Promise<boolean> {
  const key = toRegExePath(path);
  const res = await $`reg.exe query ${key}`.nothrow().quiet();
  return res.exitCode === 0;
}

export async function regGet(path: string, name: string): Promise<string | number | null> {
  const key = toRegExePath(path);
  const isDefault = name.toLowerCase() === "(default)";
  const res = isDefault
    ? await $`reg.exe query ${key} /ve`.nothrow().quiet()
    : await $`reg.exe query ${key} /v ${name}`.nothrow().quiet();

  if (res.exitCode !== 0) return null;

  const lines = res.stdout.toString().split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s{4}.+?\s{4}(REG_\w+)\s{4}(.*)$/);
    if (!match) continue;
    const [, regType, rawValue] = match;
    if (regType === "REG_DWORD") {
      return Number.parseInt(rawValue.trim(), rawValue.trim().startsWith("0x") ? 16 : 10);
    }
    return rawValue;
  }
  return null;
}

export async function regSet(
  path: string,
  name: string,
  value: string | number,
  type: "String" | "DWord"
): Promise<void> {
  const key = toRegExePath(path);
  const regType = type === "DWord" ? "REG_DWORD" : "REG_SZ";
  const strVal = String(value);
  const isDefault = name.toLowerCase() === "(default)";

  const res = isDefault
    ? await $`reg.exe add ${key} /ve /t ${regType} /d ${strVal} /f`.nothrow().quiet()
    : await $`reg.exe add ${key} /v ${name} /t ${regType} /d ${strVal} /f`.nothrow().quiet();

  if (res.exitCode !== 0) {
    const err = res.stderr.toString().trim() || res.stdout.toString().trim();
    throw new Error(`reg add ${key}\\${name} failed: ${err}`);
  }
}

export async function testRegistryTargets(targets: RegistryTarget[]): Promise<boolean> {
  for (const target of targets) {
    const current = await regGet(target.path, target.name);
    if (current !== target.value) return false;
  }
  return true;
}

export async function setRegistryTargets(targets: RegistryTarget[]): Promise<boolean> {
  let changed = false;
  for (const target of targets) {
    const current = await regGet(target.path, target.name);
    if (current !== target.value) {
      await regSet(target.path, target.name, target.value, target.type);
      changed = true;
    }
  }
  return changed;
}

export function requestExplorerRestart(ctx: ResourceContext): void {
  ctx.onPostInstall("restart-explorer", async () => {
    await runPwsh(`
if (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue)) { return }
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
$deadline = (Get-Date).AddSeconds(5)
while (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 200
}
if (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue)) {
    Start-Process explorer.exe
}
`);
  });
}

export function testSafePath(targetPath: string): boolean {
  if (!targetPath || !targetPath.trim()) return false;
  if (!isAbsolute(targetPath)) return false;
  if (/^[A-Za-z]:(?![\\/])/.test(targetPath)) return false;

  let full: string;
  try {
    full = resolve(targetPath);
  } catch {
    return false;
  }

  if (/(^|[\\/])\.\.([\\/]|$)/.test(full)) return false;

  const { root } = parse(full);
  if (full === root) return false;
  const normalized = full.replace(/[\\/]+$/, "").toLowerCase();

  const home = process.env.USERPROFILE || homedir();
  const protectedDirs = [
    home,
    process.env.APPDATA,
    process.env.LOCALAPPDATA,
    process.env.SystemRoot,
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.ProgramData,
    home ? resolve(home, "..") : undefined,
  ];

  for (const candidate of protectedDirs) {
    if (!candidate || !candidate.trim()) continue;
    const normCandidate = resolve(candidate).replace(/[\\/]+$/, "").toLowerCase();
    if (normalized === normCandidate) return false;
  }

  return true;
}

export async function removePath(targetPath: string): Promise<void> {
  if (!testSafePath(targetPath)) {
    throw new Error(`refusing unsafe path: ${targetPath}`);
  }
  if (!existsSync(targetPath)) return;
  await rm(targetPath, { recursive: true, force: true });
}

export async function testWingetPackage(id: string): Promise<boolean> {
  if (!Bun.which("winget")) {
    throw new Error("winget is not available; install App Installer from the Microsoft Store");
  }
  const res = await $`winget list --id ${id} --exact --accept-source-agreements`.nothrow().quiet();
  if (res.exitCode !== 0) return false;
  const needle = id.toLowerCase();
  return res.stdout
    .toString()
    .split(/\r?\n/)
    .some((line) => line.toLowerCase().includes(needle));
}

export async function removeWingetPackage(id: string): Promise<void> {
  if (!(await testWingetPackage(id))) return;
  const res = await $`winget uninstall --id ${id} --exact --silent --accept-source-agreements`.nothrow().quiet();
  if (res.exitCode !== 0) {
    const detail = res.stderr.toString().trim() || res.stdout.toString().trim();
    throw new Error(`failed to uninstall (package) ${id}${detail ? `\n${detail}` : ""}`);
  }
}
