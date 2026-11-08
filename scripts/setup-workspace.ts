#!/usr/bin/env bun
/**
 * Ensure the ~/Workspace layout exists and that ~/Workspace/Bin is on the
 * user PATH.
 *
 * Usage: bun scripts/setup-workspace.ts
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

const WORKSPACE = join(homedir(), "Workspace");
const WORKSPACE_DIRS = ["Repos", "Scratch", "Bin"];
const BIN = join(WORKSPACE, "Bin");

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

function addToWindowsUserPath(dir: string): "added" | "present" {
  // Read and write HKCU\Environment directly so REG_EXPAND_SZ values keep
  // expanding and existing entries keep their order.
  const script = `
$ErrorActionPreference = 'Stop'
$target = $env:DOTFILES_WORKSPACE_BIN
$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
$value = ''
$kind = [Microsoft.Win32.RegistryValueKind]::ExpandString
if ($null -ne $key -and ($key.GetValueNames() -contains 'Path')) {
  $value = [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
  $kind = $key.GetValueKind('Path')
}
$parts = @($value -split ';' | Where-Object { $_ -ne '' })
$already = $parts | Where-Object {
  ([Environment]::ExpandEnvironmentVariables($_)).TrimEnd('\\') -eq $target
}
if ($already) {
  Write-Output 'present'
  exit 0
}
if ($null -eq $key) {
  $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment')
}
$key.SetValue('Path', (@($parts) + $target) -join ';', $kind)
Write-Output 'added'
`;

  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { encoding: "utf8", env: { ...process.env, DOTFILES_WORKSPACE_BIN: dir } },
  ).trim();

  if (output === "added" || output === "present") {
    return output;
  }
  throw new Error(`Unexpected PowerShell output: ${output}`);
}

async function addToPosixUserPath(): Promise<"added" | "present"> {
  const home = homedir();
  const shell = basename(process.env.SHELL ?? "");
  const marker = "$HOME/Workspace/Bin";

  let rcFile: string;
  let block: string;
  if (shell === "fish") {
    rcFile = join(home, ".config", "fish", "config.fish");
    block = `fish_add_path ${marker}\n`;
  } else {
    rcFile =
      shell === "zsh"
        ? join(home, ".zshrc")
        : shell === "bash"
          ? join(home, ".bashrc")
          : join(home, ".profile");
    block = `\n# Added by the dotfiles setup-workspace script.\ncase ":$PATH:" in\n  *":${marker}:"*) ;;\n  *) export PATH="${marker}:$PATH" ;;\nesac\n`;
  }

  let content = "";
  try {
    content = await readFile(rcFile, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  if (content.includes(marker)) {
    return "present";
  }

  await mkdir(dirname(rcFile), { recursive: true });
  const separator = content === "" || content.endsWith("\n") ? "" : "\n";
  await writeFile(rcFile, content + separator + block, "utf8");
  return "added";
}

function display(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

async function main(): Promise<void> {
  for (const name of WORKSPACE_DIRS) {
    const dir = join(WORKSPACE, name);
    const result = await ensureDir(dir);
    console.log(`${display(dir)}: ${result === "created" ? "created" : "ok"}`);
  }

  const pathResult =
    process.platform === "win32"
      ? addToWindowsUserPath(BIN)
      : await addToPosixUserPath();

  if (pathResult === "added") {
    console.log(`${display(BIN)}: added to the user PATH (restart your shell)`);
  } else {
    console.log(`${display(BIN)}: already on the user PATH`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
