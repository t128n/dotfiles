#!/usr/bin/env bun
/**
 * Mirror the env defaults declared in the global mise config into the Windows
 * user environment, so editors and GUI apps see the same tool paths as an
 * activated shell. Also puts the cargo bin directory on the user PATH.
 *
 * Usage: bun scripts/setup-env.ts [--check]
 */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
const CONFIG = join(HOME, ".config", "mise", "config.toml");
const CARGO_BIN = join(HOME, ".local", "share", "cargo", "bin");
const CHECK = process.argv.includes("--check");

interface WindowsEnvResult {
  changed: string[];
  unchanged: string[];
  removed: string[];
  path: "added" | "present";
}

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

async function readManagedKeys(): Promise<string[]> {
  let text: string;
  try {
    text = await readFile(CONFIG, "utf8");
  } catch {
    fail(`${CONFIG} is missing; run \`mise run apply\` first`);
  }

  const parsed = Bun.TOML.parse(text) as { env?: Record<string, unknown> };
  return Object.keys(parsed.env ?? {}).filter((key) => !key.startsWith("_"));
}

function resolveEnv(keys: string[]): Map<string, string> {
  let output: string;
  try {
    output = execFileSync("mise", ["env", "--json"], {
      cwd: HOME,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = (error as { stderr?: Buffer }).stderr?.toString().trim();
    fail(`mise env --json failed${detail ? `: ${detail}` : ""}`);
  }

  const resolved = JSON.parse(output) as Record<string, unknown>;
  const values = new Map<string, string>();
  for (const key of keys) {
    const value = resolved[key];
    if (typeof value !== "string") {
      fail(`mise did not resolve ${key}; check the [env] block in ${CONFIG}`);
    }
    values.set(key, value);
  }
  return values;
}

// Registry values point at %USERPROFILE% so they survive a renamed profile,
// and use backslashes because some Windows software rejects forward slashes.
function toRegistryValue(value: string): string {
  const normalized = value.replace(/\//g, "\\");
  const home = HOME.replace(/\//g, "\\");
  if (normalized.toLowerCase().startsWith(home.toLowerCase())) {
    return "%USERPROFILE%" + normalized.slice(home.length);
  }
  return normalized;
}

function applyWindowsEnv(desired: Map<string, string>): WindowsEnvResult {
  const script = `
$ErrorActionPreference = 'Stop'
$desired = ConvertFrom-Json -InputObject $env:DOTFILES_ENV_JSON
$check = $env:DOTFILES_ENV_CHECK -eq '1'
$pathEntry = $env:DOTFILES_CARGO_BIN
$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
if ($null -eq $key) {
  $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment')
}
$names = @($key.GetValueNames())
$changed = New-Object System.Collections.Generic.List[string]
$unchanged = New-Object System.Collections.Generic.List[string]
foreach ($property in $desired.PSObject.Properties) {
  $name = $property.Name
  $value = [string]$property.Value
  $existing = $null
  $kind = $null
  if ($names -contains $name) {
    $existing = [string]$key.GetValue($name, '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
    $kind = $key.GetValueKind($name)
  }
  $same = ($null -ne $existing) -and ($kind -eq [Microsoft.Win32.RegistryValueKind]::ExpandString) -and (($existing -replace '/', '\\') -ieq ($value -replace '/', '\\'))
  if ($same) {
    $null = $unchanged.Add($name)
    continue
  }
  $null = $changed.Add($name)
  if (-not $check) {
    $key.SetValue($name, $value, [Microsoft.Win32.RegistryValueKind]::ExpandString)
  }
}
$desiredNames = @($desired.PSObject.Properties | ForEach-Object { $_.Name })
$stateKey = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Software\\t128n\\dotfiles')
$previous = @($stateKey.GetValue('ManagedEnv', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames) -split ',' | Where-Object { $_ -ne '' })
# Values written by a previous run that the config no longer declares.
$removed = @($previous | Where-Object { $desiredNames -notcontains $_ -and $names -contains $_ })
foreach ($name in $removed) {
  if (-not $check) {
    $key.DeleteValue($name, $false)
  }
}
if (-not $check) {
  $stateKey.SetValue('ManagedEnv', ($desiredNames -join ','), [Microsoft.Win32.RegistryValueKind]::String)
}
$stateKey.Close()

$normalize = { param($entry) ([Environment]::ExpandEnvironmentVariables($entry)).TrimEnd('\\') }
$pathValue = ''
$pathKind = [Microsoft.Win32.RegistryValueKind]::ExpandString
if ($names -contains 'Path') {
  $pathValue = [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
  $pathKind = $key.GetValueKind('Path')
}
# A REG_SZ Path is not expanded by Windows, so store the absolute directory
# there and reserve the %USERPROFILE% form for REG_EXPAND_SZ.
if ($pathKind -eq [Microsoft.Win32.RegistryValueKind]::ExpandString) {
  $pathEntryValue = $pathEntry
} else {
  $pathEntryValue = $env:DOTFILES_CARGO_BIN_ABSOLUTE
}
$parts = @($pathValue -split ';' | Where-Object { $_ -ne '' })
$target = (& $normalize $pathEntry)
$present = @($parts | Where-Object { (& $normalize $_) -ieq $target }).Count -gt 0
if ($present) {
  $path = 'present'
} else {
  $path = 'added'
  if (-not $check) {
    $parts = @($parts) + $pathEntryValue
    $key.SetValue('Path', ($parts -join ';'), $pathKind)
  }
}
$key.Close()
# Ask Explorer to reload the user environment so newly launched apps and
# editors see the values without a sign-out.
if (-not $check -and (($changed.Count -gt 0) -or ($removed.Count -gt 0) -or ($path -eq 'added'))) {
  try {
    Add-Type -Namespace Dotfiles -Name Env -MemberDefinition @'
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
'@
    $result = [UIntPtr]::Zero
    $null = [Dotfiles.Env]::SendMessageTimeout([IntPtr]0xffff, 0x001A, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$result)
  } catch {
  }
}
@{ changed = @($changed); unchanged = @($unchanged); removed = @($removed); path = $path } | ConvertTo-Json -Compress
`;

  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DOTFILES_ENV_JSON: JSON.stringify(Object.fromEntries(desired)),
        DOTFILES_ENV_CHECK: CHECK ? "1" : "0",
        DOTFILES_CARGO_BIN: toRegistryValue(CARGO_BIN),
        DOTFILES_CARGO_BIN_ABSOLUTE: CARGO_BIN,
      },
    },
  ).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    fail(`Unexpected PowerShell output: ${output}`);
  }

  const result = parsed as Partial<WindowsEnvResult>;
  if (
    Array.isArray(result.changed) &&
    Array.isArray(result.unchanged) &&
    Array.isArray(result.removed) &&
    (result.path === "added" || result.path === "present")
  ) {
    return {
      changed: result.changed,
      unchanged: result.unchanged,
      removed: result.removed,
      path: result.path,
    };
  }
  fail(`Unexpected PowerShell output: ${output}`);
}

function report(desired: Map<string, string>, result: WindowsEnvResult): void {
  const changed = new Set(result.changed);
  const width = Math.max(
    ...[...desired.keys(), ...result.removed].map((key) => key.length),
  );
  for (const [key, value] of desired) {
    const state = changed.has(key) ? (CHECK ? "would set" : "set      ") : "unchanged";
    console.log(`${key.padEnd(width)}  ${state}  ${value}`);
  }
  for (const key of result.removed) {
    console.log(`${key.padEnd(width)}  ${CHECK ? "would drop" : "dropped  "}  not in the mise config`);
  }

  const drift =
    result.changed.length + result.removed.length + (result.path === "added" ? 1 : 0);
  if (result.path === "added") {
    console.log(`${"Path".padEnd(width)}  ${CHECK ? "would add" : "added    "}  cargo bin directory`);
  }

  if (CHECK) {
    if (drift > 0) {
      console.error(`\n${drift} value(s) differ from the user environment; run \`mise run env\`.`);
      process.exit(1);
    }
    console.log("\nThe user environment matches the mise config.");
    return;
  }

  console.log(
    drift > 0
      ? `\nUpdated ${drift} value(s). Restart your shell and editors to pick them up.`
      : "\nThe user environment already matches the mise config.",
  );
}

async function main(): Promise<void> {
  const unknown = process.argv.slice(2).filter((arg) => arg !== "--check");
  if (unknown.length > 0) {
    fail(`unknown argument(s): ${unknown.join(" ")}`);
  }

  if (process.platform !== "win32") {
    console.log(
      "Nothing to do: mise [env] applies these values in activated shells on this platform.",
    );
    return;
  }

  const desired = new Map(
    [...resolveEnv(await readManagedKeys())].map(([key, value]) => [
      key,
      toRegistryValue(value),
    ]),
  );
  report(desired, applyWindowsEnv(desired));
}

async function run(): Promise<void> {
  await main();
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
