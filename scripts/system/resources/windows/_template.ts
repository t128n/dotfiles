// Windows resource template. Copy to resources/windows/<Verb>-<Thing>.ts.
// Files starting with _ are skipped by run.ts.
import { defineResource } from "../../lib/types.ts";
import { requestExplorerRestart, setRegistryTargets, testRegistryTargets, type RegistryTarget } from "../../lib/windows.ts";

const TARGETS: RegistryTarget[] = [
  // { path: "HKCU:\\Software\\...", name: "ValueName", value: 1, type: "DWord" },
];

export default defineResource({
  async test() {
    return testRegistryTargets(TARGETS);
  },

  async set(ctx) {
    if (await setRegistryTargets(TARGETS)) {
      requestExplorerRestart(ctx);
    }
  },

  async unset() {
    // Restore hook; kept for DSC interface symmetry.
  },
});
