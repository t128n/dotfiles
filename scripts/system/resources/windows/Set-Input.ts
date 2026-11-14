// Keyboard repeat rate and mouse pointer acceleration.
import { defineResource } from "../../lib/types.ts";
import { setRegistryTargets, testRegistryTargets, type RegistryTarget } from "../../lib/windows.ts";

const KEYBOARD_KEY = "HKCU:\\Control Panel\\Keyboard";
const MOUSE_KEY = "HKCU:\\Control Panel\\Mouse";

const TARGETS: RegistryTarget[] = [
  { path: KEYBOARD_KEY, name: "KeyboardDelay", value: "0", type: "String" },
  { path: KEYBOARD_KEY, name: "KeyboardSpeed", value: "31", type: "String" },
  { path: MOUSE_KEY, name: "MouseSpeed", value: "0", type: "String" },
  { path: MOUSE_KEY, name: "MouseThreshold1", value: "0", type: "String" },
  { path: MOUSE_KEY, name: "MouseThreshold2", value: "0", type: "String" },
];

export default defineResource({
  async test() {
    return testRegistryTargets(TARGETS);
  },

  async set() {
    await setRegistryTargets(TARGETS);
  },
});
