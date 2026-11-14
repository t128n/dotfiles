// Removes non-existent and duplicate entries from HKCU\Environment\Path.
import { defineResource } from "../../lib/types.ts";
import { runPwsh } from "../../lib/windows.ts";

const INSPECT_SCRIPT = `
$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $false)
if ($null -eq $key) { '[]'; return }
$raw = [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
$entries = @($raw -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$kept = New-Object System.Collections.Generic.List[string]
$orphaned = New-Object System.Collections.Generic.List[string]
foreach ($entry in $entries) {
    if (-not $seen.Add($entry)) {
        $orphaned.Add($entry)
        continue
    }
    $expanded = [Environment]::ExpandEnvironmentVariables($entry)
    if (Test-Path -LiteralPath $expanded) {
        $kept.Add($entry)
    } else {
        $orphaned.Add($entry)
    }
}
@{ changed = ($orphaned.Count -gt 0); kept = @($kept) } | ConvertTo-Json -Compress
`;

async function inspectUserPath(): Promise<{ changed: boolean; kept: string[] }> {
  const out = await runPwsh(INSPECT_SCRIPT);
  return JSON.parse(out.trim()) as { changed: boolean; kept: string[] };
}

export default defineResource({
  async test() {
    const { changed } = await inspectUserPath();
    return !changed;
  },

  async set() {
    const { changed, kept } = await inspectUserPath();
    if (!changed) return;

    const joined = kept.join(";").replace(/'/g, "''");
    await runPwsh(`
$ErrorActionPreference = 'Stop'
$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
if ($null -eq $key) { throw 'HKCU:\\Environment key is missing' }
$kind = [Microsoft.Win32.RegistryValueKind]::ExpandString
try { $kind = $key.GetValueKind('Path') } catch {}
$key.SetValue('Path', '${joined}', $kind)

if (-not ('Win32.EnvBroadcast' -as [type])) {
    Add-Type -Namespace Win32 -Name EnvBroadcast -MemberDefinition @'
        [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true, CharSet = System.Runtime.InteropServices.CharSet.Auto)]
        public static extern System.IntPtr SendMessageTimeout(System.IntPtr hWnd, uint Msg, System.UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out System.UIntPtr lpdwResult);
'@
}
$result = [UIntPtr]::Zero
[void][Win32.EnvBroadcast]::SendMessageTimeout([IntPtr]0xffff, 0x001A, [UIntPtr]::Zero, 'Environment', 0x0002, 5000, [ref]$result)
`);
  },
});
