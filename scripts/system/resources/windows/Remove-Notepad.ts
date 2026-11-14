// Removes the modern Windows 11 Notepad Store app (Microsoft.WindowsNotepad).
import { defineResource } from "../../lib/types.ts";
import { runPwsh } from "../../lib/windows.ts";

export default defineResource({
  async test() {
    const out = await runPwsh(
      "if (Get-AppxPackage -Name 'Microsoft.WindowsNotepad' -ErrorAction SilentlyContinue) { 'installed' }"
    );
    return out.trim() !== "installed";
  },

  async set() {
    await runPwsh(`
Get-Process -Name Notepad -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-AppxPackage -Name 'Microsoft.WindowsNotepad' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction Stop
`);
  },
});
