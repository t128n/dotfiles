// Windows shell theme and transparency.
// AppsUseLightTheme is intentionally left unmanaged so PowerToys Light Switch
// controls app theme scheduling.
import { defineResource } from "../../lib/types.ts";
import {
  requestExplorerRestart,
  setRegistryTargets,
  testRegistryTargets,
  type RegistryTarget,
} from "../../lib/windows.ts";

const PERSONALIZE_KEY = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";

const TARGETS: RegistryTarget[] = [
  { path: PERSONALIZE_KEY, name: "SystemUsesLightTheme", value: 0, type: "DWord" },
  { path: PERSONALIZE_KEY, name: "EnableTransparency", value: 0, type: "DWord" },
  { path: PERSONALIZE_KEY, name: "ColorPrevalence", value: 0, type: "DWord" },
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
