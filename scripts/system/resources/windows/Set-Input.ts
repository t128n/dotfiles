// Keyboard repeat rate and mouse pointer sensitivity / acceleration ("Enhance pointer precision").
import { defineResource } from "../../lib/types.ts";
import { runPwsh, setRegistryTargets, testRegistryTargets, type RegistryTarget } from "../../lib/windows.ts";

const KEYBOARD_KEY = "HKCU:\\Control Panel\\Keyboard";
const MOUSE_KEY = "HKCU:\\Control Panel\\Mouse";

const TARGETS: RegistryTarget[] = [
  { path: KEYBOARD_KEY, name: "KeyboardDelay", value: "0", type: "String" },
  { path: KEYBOARD_KEY, name: "KeyboardSpeed", value: "31", type: "String" },
  { path: MOUSE_KEY, name: "MouseSensitivity", value: "10", type: "String" },
  { path: MOUSE_KEY, name: "MouseSpeed", value: "1", type: "String" },
  { path: MOUSE_KEY, name: "MouseThreshold1", value: "6", type: "String" },
  { path: MOUSE_KEY, name: "MouseThreshold2", value: "10", type: "String" },
];

export default defineResource({
  async test() {
    return testRegistryTargets(TARGETS);
  },

  async set() {
    await setRegistryTargets(TARGETS);
    await runPwsh(`
Add-Type -Namespace Win32 -Name InputNative -MemberDefinition @'
    [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true)]
    public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, int[] pvParam, uint fWinIni);

    [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true)]
    public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, System.IntPtr pvParam, uint fWinIni);
'@
# SPI_SETMOUSE (0x0004) with SPIF_UPDATEINIFILE | SPIF_SENDCHANGE (0x03).
if (-not [Win32.InputNative]::SystemParametersInfo(0x0004, 0, [int[]]@(6, 10, 1), 0x03)) {
    throw 'SystemParametersInfo(SPI_SETMOUSE) failed'
}
# SPI_SETMOUSESPEED (0x0071) with SPIF_UPDATEINIFILE | SPIF_SENDCHANGE (0x03).
if (-not [Win32.InputNative]::SystemParametersInfo(0x0071, 0, [IntPtr]10, 0x03)) {
    throw 'SystemParametersInfo(SPI_SETMOUSESPEED) failed'
}
`);
  },
});
