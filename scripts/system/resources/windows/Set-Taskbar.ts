// Taskbar position (bottom), multi-monitor window display, and declutter.
import { defineResource } from "../../lib/types.ts";
import {
  requestExplorerRestart,
  runPwsh,
  setRegistryTargets,
  testRegistryTargets,
  type RegistryTarget,
} from "../../lib/windows.ts";

const STUCK_RECTS_KEY = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StuckRects3";
const ADVANCED_KEY = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";
const BOTTOM = 3;

const ADVANCED_TARGETS: RegistryTarget[] = [
  { path: ADVANCED_KEY, name: "MMTaskbarEnabled", value: 1, type: "DWord" },
  { path: ADVANCED_KEY, name: "MMTaskbarMode", value: 0, type: "DWord" },
  { path: ADVANCED_KEY, name: "TaskbarAl", value: 0, type: "DWord" },
  { path: ADVANCED_KEY, name: "TaskbarDa", value: 0, type: "DWord" },
  { path: ADVANCED_KEY, name: "TaskbarMn", value: 0, type: "DWord" },
  { path: ADVANCED_KEY, name: "ShowTaskViewButton", value: 0, type: "DWord" },
  { path: ADVANCED_KEY, name: "ShowCopilotButton", value: 0, type: "DWord" },
];

async function getTaskbarPosition(): Promise<number | null> {
  const out = await runPwsh(`
$settings = (Get-ItemProperty -Path '${STUCK_RECTS_KEY}' -Name Settings -ErrorAction SilentlyContinue).Settings
if ($settings -and $settings.Length -gt 12) { [int]$settings[12] }
`);
  const parsed = Number.parseInt(out.trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export default defineResource({
  async test() {
    if ((await getTaskbarPosition()) !== BOTTOM) return false;
    return testRegistryTargets(ADVANCED_TARGETS);
  },

  async set(ctx) {
    let changed = false;
    if ((await getTaskbarPosition()) !== BOTTOM) {
      await runPwsh(`
$settings = (Get-ItemProperty -Path '${STUCK_RECTS_KEY}' -Name Settings -ErrorAction SilentlyContinue).Settings
if (-not $settings -or $settings.Length -le 12) { throw 'taskbar position registry value is missing' }
$updated = [byte[]]$settings.Clone()
$updated[12] = ${BOTTOM}
Set-ItemProperty -Path '${STUCK_RECTS_KEY}' -Name Settings -Value $updated -Type Binary
`);
      changed = true;
    }

    if (await setRegistryTargets(ADVANCED_TARGETS)) {
      changed = true;
    }

    if (changed) {
      requestExplorerRestart(ctx);
    }
  },
});
