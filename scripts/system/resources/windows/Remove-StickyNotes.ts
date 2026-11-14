// Removes the Microsoft Sticky Notes Store app (Microsoft.MicrosoftStickyNotes).
import { defineResource } from "../../lib/types.ts";
import { runPwsh } from "../../lib/windows.ts";

export default defineResource({
  async test() {
    const out = await runPwsh(
      "if (Get-AppxPackage -Name 'Microsoft.MicrosoftStickyNotes' -ErrorAction SilentlyContinue) { 'installed' }"
    );
    return out.trim() !== "installed";
  },

  async set() {
    await runPwsh(`
Get-Process -Name Microsoft.Notes -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-AppxPackage -Name 'Microsoft.MicrosoftStickyNotes' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction Stop
`);
  },
});
