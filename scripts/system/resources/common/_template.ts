// Cross-platform resource template. Copy to resources/common/<Name>.ts.
// Files starting with _ are skipped by run.ts.
import { defineResource, runPlatformCommand } from "../../lib/types.ts";

export default defineResource({
  // Optional: limit to specific platforms (omit for all).
  // platforms: ["windows", "macos", "linux"],

  // Optional platform-specific shell commands used by runPlatformCommand(this, ctx).
  windowsCmd: "echo windows",
  macosCmd: "echo macos",
  linuxCmd: "echo linux",

  async test(ctx) {
    return true;
  },

  async set(ctx) {
    await runPlatformCommand(this, ctx);
    // Optional deduplicated post-install hook:
    // ctx.onPostInstall("my-hook", async () => { ... });
  },

  async unset(ctx) {
    // Optional restore hook; never called by normal runs.
  },
});
