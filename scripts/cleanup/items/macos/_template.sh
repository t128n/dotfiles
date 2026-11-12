#!/usr/bin/env bash
# Cleanup item template for macOS. Copy to items/macos/<name>.sh.
#
# Contract (sourced by macos.sh, never run directly):
#   test_item   return 0 when the item is already in the desired state, 1 otherwise
#   set_item    enforce the desired state; return non-zero on failure
#   unset_item  optional restore hook; the item run never calls it
#
# Available helpers:
#   cask_installed NAME, formula_installed NAME
#   remove_cask NAME, remove_formula NAME
#   path_exists PATH, remove_path PATH, safe_path PATH
#
# Items are idempotent: absent items are skipped, and a repeated --apply run
# succeeds. Do not print routine output; the executor reports item names.

test_item() {
  # Return 1 when the machine does not match, for example:
  # cask_installed some-app && return 1
  # path_exists "$HOME/Library/Application Support/SomeApp" && return 1
  return 0
}

set_item() {
  # Enforce the desired state, for example:
  # remove_cask some-app || return 1
  # remove_path "$HOME/Library/Application Support/SomeApp" || return 1
  return 0
}

unset_item() {
  # Cleanup items do not restore; kept for interface symmetry.
  return 0
}
