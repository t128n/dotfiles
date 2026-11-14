// macOS resource template. Copy to resources/macos/<name>.ts.
// Files starting with _ are skipped by run.ts.
import { $ } from "bun";
import { defineResource } from "../../lib/types.ts";

export default defineResource({
  async test() {
    return true;
  },

  async set(ctx) {
    // Example:
    // await $`defaults write com.apple.finder AppleShowAllExtensions -bool true`;
    // ctx.onPostInstall("restart-finder", async () => { await $`killall Finder`.nothrow(); });
  },

  async unset() {
    // Restore hook; kept for DSC interface symmetry.
  },
});
