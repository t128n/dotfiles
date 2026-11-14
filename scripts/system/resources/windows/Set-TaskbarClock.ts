// Taskbar clock format and regional date/time display:
// 24-hour time (HH:mm / HH:mm:ss), second precision, and ISO 8601 short dates.
import { defineResource } from "../../lib/types.ts";
import {
  requestExplorerRestart,
  setRegistryTargets,
  testRegistryTargets,
  type RegistryTarget,
} from "../../lib/windows.ts";

const ADVANCED_KEY = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";
const INTERNATIONAL_KEY = "HKCU:\\Control Panel\\International";

const TARGETS: RegistryTarget[] = [
  { path: ADVANCED_KEY, name: "ShowSecondsInSystemClock", value: 1, type: "DWord" },
  { path: INTERNATIONAL_KEY, name: "sShortDate", value: "yyyy-MM-dd", type: "String" },
  { path: INTERNATIONAL_KEY, name: "sShortTime", value: "HH:mm", type: "String" },
  { path: INTERNATIONAL_KEY, name: "sTimeFormat", value: "HH:mm:ss", type: "String" },
  { path: INTERNATIONAL_KEY, name: "iTime", value: "1", type: "String" },
  { path: INTERNATIONAL_KEY, name: "iTLZero", value: "1", type: "String" },
  { path: INTERNATIONAL_KEY, name: "iDate", value: "2", type: "String" },
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
