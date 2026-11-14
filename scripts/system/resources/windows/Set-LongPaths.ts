// Enable Win32 long paths (>260 chars) under HKLM\SYSTEM\CurrentControlSet\Control\FileSystem.
import { defineResource } from "../../lib/types.ts";
import { invokeElevated, testRegistryTargets, type RegistryTarget } from "../../lib/windows.ts";

const TARGETS: RegistryTarget[] = [
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
    await invokeElevated(
      `Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem' -Name LongPathsEnabled -Value 1 -Type DWord`,
    );
  },
});
