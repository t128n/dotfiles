// File Explorer defaults: show extensions & hidden files, open to This PC,
// and enable compact mode.
import { defineResource } from "../../lib/types.ts";
import {
  requestExplorerRestart,
  setRegistryTargets,
  testRegistryTargets,
  type RegistryTarget,
} from "../../lib/windows.ts";

const ADVANCED_KEY = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";

const TARGETS: RegistryTarget[] = [
  { path: ADVANCED_KEY, name: "HideFileExt", value: 0, type: "DWord" },
  { path: ADVANCED_KEY, name: "Hidden", value: 1, type: "DWord" },
  { path: ADVANCED_KEY, name: "LaunchTo", value: 1, type: "DWord" },
  { path: ADVANCED_KEY, name: "UseCompactMode", value: 1, type: "DWord" },
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
});
