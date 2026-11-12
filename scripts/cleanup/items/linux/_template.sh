#!/usr/bin/env bash
# Cleanup item template for Linux. Copy to items/linux/<name>.sh.
#
# Contract (sourced by linux.sh, never run directly):
#   test_item   return 0 when the item is already in the desired state, 1 otherwise
#   set_item    enforce the desired state; return non-zero on failure
#   unset_item  optional restore hook; the item run never calls it
#
# Available helpers:
#   package_installed NAME, remove_package NAME (apt-get, dnf, or pacman)
#   path_exists PATH, remove_path PATH, safe_path PATH
#
# Items are idempotent: absent items are skipped, and a repeated --apply run
# succeeds. Do not print routine output; the executor reports item names.

test_item() {
  # Return 1 when the machine does not match, for example:
  # package_installed some-package && return 1
  # path_exists "$HOME/.config/some-app" && return 1
  return 0
}

set_item() {
  # Enforce the desired state, for example:
  # remove_package some-package || return 1
  # remove_path "$HOME/.config/some-app" || return 1
  return 0
}

unset_item() {
  # Cleanup items do not restore; kept for interface symmetry.
  return 0
}
