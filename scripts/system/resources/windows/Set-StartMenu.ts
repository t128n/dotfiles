// Start menu layout and promotions.
import { defineResource } from "../../lib/types.ts";
import {
  regKeyExists,
  requestExplorerRestart,
  setRegistryTargets,
  testRegistryTargets,
  type RegistryTarget,
} from "../../lib/windows.ts";

const START_KEY = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Start";
const ADVANCED_KEY = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";
const PHONE_COMPANION = `${START_KEY}\\Companions\\Microsoft.YourPhone_8wekyb3d8bbwe`;

const BASE_TARGETS: RegistryTarget[] = [
  { path: START_KEY, name: "ShowPinnedSection", value: 0, type: "DWord" },
  { path: START_KEY, name: "ShowRecentSection", value: 0, type: "DWord" },
  { path: START_KEY, name: "ShowAllAppsSection", value: 1, type: "DWord" },
  { path: START_KEY, name: "AllAppsViewMode", value: 1, type: "DWord" },
  { path: ADVANCED_KEY, name: "Start_IrisRecommendations", value: 0, type: "DWord" },
  { path: ADVANCED_KEY, name: "Start_AccountNotifications", value: 0, type: "DWord" },
  { path: ADVANCED_KEY, name: "Start_TrackProgs", value: 0, type: "DWord" },
];

async function getTargets(): Promise<RegistryTarget[]> {
  if (await regKeyExists(PHONE_COMPANION)) {
    return [...BASE_TARGETS, { path: PHONE_COMPANION, name: "IsEnabled", value: 0, type: "DWord" }];
  }
  return BASE_TARGETS;
}

export default defineResource({
  async test() {
    return testRegistryTargets(await getTargets());
  },

  async set(ctx) {
    if (await setRegistryTargets(await getTargets())) {
      requestExplorerRestart(ctx);
    }
  },
});
