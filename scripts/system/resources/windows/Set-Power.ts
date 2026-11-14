// Disable Windows Fast Startup (HiberbootEnabled = 0) under HKLM.
import { defineResource } from "../../lib/types.ts";
import { invokeElevated, testRegistryTargets, type RegistryTarget } from "../../lib/windows.ts";

const POWER_KEY = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power";

const TARGETS: RegistryTarget[] = [
  {
    path: POWER_KEY,
    name: "HiberbootEnabled",
    value: 0,
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
if (-not (Test-Path -LiteralPath '${POWER_KEY}')) {
    New-Item -Path '${POWER_KEY}' -Force | Out-Null
}
Set-ItemProperty -Path '${POWER_KEY}' -Name HiberbootEnabled -Value 0 -Type DWord
`);
  },
});
