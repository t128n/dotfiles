// Linux resource template. Copy to resources/linux/<name>.ts.
// Files starting with _ are skipped by run.ts.
import { $ } from "bun";
import { defineResource } from "../../lib/types.ts";

export default defineResource({
  async test() {
    return true;
  },

  async set(ctx) {
    // Enforce desired state; throw on failure.
  },

  async unset() {
    // Restore hook; kept for DSC interface symmetry.
  },
});
