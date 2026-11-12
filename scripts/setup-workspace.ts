#!/usr/bin/env bun
/**
 * Ensure the ~/Workspace layout and ~/.local/bin exist, and that
 * ~/.local/bin is on the user PATH.
 *
 * Usage: bun scripts/setup-workspace.ts
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

const HOME = homedir();
const WORKSPACE = join(HOME, "Workspace");
const WORKSPACE_DIRS = ["Repos", "Resources", "Scratch"];
const BIN = join(HOME, ".local", "bin");
const LEGACY_BIN = join(WORKSPACE, "Bin");
const PATH_MARKER = "# Added by the dotfiles setup-workspace script: ~/.local/bin on PATH";

async function ensureDir(dir: string): Promise<"created" | "present"> {
  try {
    const info = await stat(dir);
    if (!info.isDirectory()) {
      throw new Error(`${dir} exists but is not a directory`);
    }
    return "present";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    await mkdir(dir, { recursive: true });
    return "created";
  }
}

interface WindowsPathResult {
  path: "added" | "present";
  stale: "removed" | "absent";
}

function updateWindowsUserPath(bin: string, legacyBin: string): WindowsPathResult {
  // Read and write HKCU\Environment directly so REG_EXPAND_SZ values keep
  // expanding and existing entries keep their order.
  const script = `
$ErrorActionPreference = 'Stop'
$target = ([Environment]::ExpandEnvironmentVariables($env:DOTFILES_BIN_DIR)).TrimEnd('\\')
$legacy = ([Environment]::ExpandEnvironmentVariables($env:DOTFILES_LEGACY_BIN_DIR)).TrimEnd('\\')
$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
$value = ''
$kind = [Microsoft.Win32.RegistryValueKind]::ExpandString
if ($null -ne $key -and ($key.GetValueNames() -contains 'Path')) {
  $value = [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
  $kind = $key.GetValueKind('Path')
}
$parts = @($value -split ';' | Where-Object { $_ -ne '' })
$normalize = {
  param($entry)
  ([Environment]::ExpandEnvironmentVariables($entry)).TrimEnd('\\')
}
$legacyParts = @($parts | Where-Object { (& $normalize $_) -eq $legacy })
$parts = @($parts | Where-Object { (& $normalize $_) -ne $legacy })
$already = @($parts | Where-Object { (& $normalize $_) -eq $target })
$changed = $false
if ($legacyParts.Count -gt 0) { $changed = $true }
if ($already.Count -eq 0) {
  $parts = @($parts) + $target
  $changed = $true
}
if ($changed) {
  if ($null -eq $key) {
    $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment')
  }
  $key.SetValue('Path', ($parts -join ';'), $kind)
}
@{ path = $(if ($already.Count -eq 0) { 'added' } else { 'present' }); stale = $(if ($legacyParts.Count -gt 0) { 'removed' } else { 'absent' }) } | ConvertTo-Json -Compress
`;

  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DOTFILES_BIN_DIR: bin,
        DOTFILES_LEGACY_BIN_DIR: legacyBin,
      },
    },
  ).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new Error(`Unexpected PowerShell output: ${output}`);
  }

  const result = parsed as Partial<WindowsPathResult>;
  const path = result?.path;
  const stale = result?.stale;
  if (
    (path === "added" || path === "present") &&
    (stale === "removed" || stale === "absent")
  ) {
    return { path, stale };
  }
  throw new Error(`Unexpected PowerShell output: ${output}`);
}

async function addToPosixUserPath(): Promise<"added" | "present"> {
  const shell = basename(process.env.SHELL ?? "");
  const target = "$HOME/.local/bin";

  let rcFile: string;
  let block: string;
  if (shell === "fish") {
    rcFile = join(HOME, ".config", "fish", "config.fish");
    block = `${PATH_MARKER}\nfish_add_path ${target}\n`;
  } else {
    rcFile =
      shell === "zsh"
        ? join(HOME, ".zshrc")
        : shell === "bash"
          ? join(HOME, ".bashrc")
          : join(HOME, ".profile");
    block = `\n${PATH_MARKER}\ncase ":$PATH:" in\n  *":${target}:"*) ;;\n  *) export PATH="${target}:$PATH" ;;\nesac\n`;
  }

  let content = "";
  try {
    content = await readFile(rcFile, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  if (content.includes(PATH_MARKER)) {
    return "present";
  }

  await mkdir(dirname(rcFile), { recursive: true });
  const separator = content === "" || content.endsWith("\n") ? "" : "\n";
  await writeFile(rcFile, content + separator + block, "utf8");
  return "added";
}

function display(path: string): string {
  return path.startsWith(HOME) ? `~${path.slice(HOME.length)}` : path;
}

async function main(): Promise<void> {
  const dirs = [WORKSPACE, ...WORKSPACE_DIRS.map((name) => join(WORKSPACE, name)), BIN];
  for (const dir of dirs) {
    const result = await ensureDir(dir);
    console.log(`${display(dir)}: ${result === "created" ? "created" : "ok"}`);
  }

  const pathState =
    process.platform === "win32"
      ? updateWindowsUserPath(BIN, LEGACY_BIN)
      : { path: await addToPosixUserPath(), stale: "absent" as const };

  if (pathState.path === "added") {
    console.log(`${display(BIN)}: added to the user PATH (restart your shell)`);
  } else {
    console.log(`${display(BIN)}: already on the user PATH`);
  }

  if (pathState.stale === "removed") {
    console.log(
      `${display(LEGACY_BIN)}: removed from the user PATH (move its contents to ${display(BIN)})`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
