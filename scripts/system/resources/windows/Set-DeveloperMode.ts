// Windows Developer Mode (unprivileged symlinks) and Win32 long paths.
import { defineResource } from "../../lib/types.ts";
import { invokeElevated, testRegistryTargets, type RegistryTarget } from "../../lib/windows.ts";

const TARGETS: RegistryTarget[] = [
  {
    path: "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock",
    name: "AllowDevelopmentWithoutDevLicense",
    value: 1,
    type: "DWord",
  },
  {
    path: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem",
    name: "LongPathsEnabled",
    value: 1,
    type: "DWord",
  },
];

export default defineResource({
  async test() {
    return testRegistryTargets(TARGETS);
  },

  async set() {
    await invokeElevated(`
$ErrorActionPreference = 'Stop'
$appModel = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock'
if (-not (Test-Path -LiteralPath $appModel)) {
    New-Item -Path $appModel -Force | Out-Null
}
Set-ItemProperty -Path $appModel -Name AllowDevelopmentWithoutDevLicense -Value 1 -Type DWord
Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem' -Name LongPathsEnabled -Value 1 -Type DWord
`);
  },
});
