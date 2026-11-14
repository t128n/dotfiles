// Windows mouse cursor scheme: Bibata-Modern-Classic-Regular from
// ~/.local/share/t128n-dotfiles/cursors, applied immediately via SPI_SETCURSORS.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineResource } from "../../lib/types.ts";
import {
  runPwsh,
  setRegistryTargets,
  testRegistryTargets,
  type RegistryTarget,
} from "../../lib/windows.ts";

const CURSORS_KEY = "HKCU:\\Control Panel\\Cursors";
const SCHEMES_KEY = "HKCU:\\Control Panel\\Cursors\\Schemes";
const SCHEME_NAME = "Bibata-Modern-Classic-Regular";

const CURSOR_MAP: Record<string, string> = {
  Arrow: "Pointer.cur",
  Help: "Help.cur",
  AppStarting: "Work.ani",
  Wait: "Busy.ani",
  Crosshair: "Cross.cur",
  PrecisionHair: "Cross.cur",
  IBeam: "Text.cur",
  NWPen: "Handwriting.cur",
  No: "Unavailable.cur",
  SizeNS: "Vert.cur",
  SizeWE: "Horz.cur",
  SizeNWSE: "Dgn1.cur",
  SizeNESW: "Dgn2.cur",
  Grab: "Move.cur",
  SizeAll: "Move.cur",
  UpArrow: "Alternate.cur",
  Hand: "Link.cur",
  Pin: "Pin.cur",
  Person: "Person.cur",
  Pan: "Pan.cur",
  Grabbing: "Grabbing.cur",
  "Zoom-in": "Zoom-in.cur",
  "Zoom-out": "Zoom-out.cur",
};

const SCHEME_ORDER = [
  "Pointer.cur", "Help.cur", "Work.ani", "Busy.ani", "Cross.cur", "Text.cur",
  "Handwriting.cur", "Unavailable.cur", "Vert.cur", "Horz.cur", "Dgn1.cur",
  "Dgn2.cur", "Move.cur", "Alternate.cur", "Link.cur", "Pin.cur", "Person.cur",
  "Pan.cur", "Grabbing.cur", "Zoom-in.cur", "Zoom-out.cur",
];

function getCursorDir(home: string): string {
  return join(home, ".local", "share", "t128n-dotfiles", "cursors", SCHEME_NAME);
}

function getTargets(cursorDir: string): RegistryTarget[] {
  const schemeValue = SCHEME_ORDER.map((file) => join(cursorDir, file)).join(",");
  return [
    { path: CURSORS_KEY, name: "(default)", value: SCHEME_NAME, type: "String" },
    { path: CURSORS_KEY, name: "Scheme Source", value: 1, type: "DWord" },
    ...Object.entries(CURSOR_MAP).map(([name, file]) => ({
      path: CURSORS_KEY,
      name,
      value: join(cursorDir, file),
      type: "String" as const,
    })),
    { path: SCHEMES_KEY, name: SCHEME_NAME, value: schemeValue, type: "String" },
  ];
}

export default defineResource({
  async test(ctx) {
    const cursorDir = getCursorDir(ctx.home);
    if (!existsSync(cursorDir)) return false;
    return testRegistryTargets(getTargets(cursorDir));
  },

  async set(ctx) {
    const cursorDir = getCursorDir(ctx.home);
    if (!existsSync(cursorDir)) {
      throw new Error(`cursor directory missing: ${cursorDir}; run mise dot apply first`);
    }
    for (const file of SCHEME_ORDER) {
      const fullPath = join(cursorDir, file);
      if (!existsSync(fullPath)) {
        throw new Error(`cursor file missing: ${fullPath}`);
      }
    }

    await setRegistryTargets(getTargets(cursorDir));
    await runPwsh(`
Add-Type -Namespace Win32 -Name CursorNative -MemberDefinition @'
    [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true)]
    public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, System.IntPtr pvParam, uint fWinIni);
'@
# SPI_SETCURSORS (0x0057) with SPIF_SENDCHANGE (0x02).
if (-not [Win32.CursorNative]::SystemParametersInfo(0x0057, 0, [IntPtr]::Zero, 0x02)) {
    throw 'SystemParametersInfo(SPI_SETCURSORS) failed'
}
`);
  },
});
