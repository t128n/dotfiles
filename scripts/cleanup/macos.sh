#!/usr/bin/env bash
# Execute the macOS cleanup items under items/macos.
#
# Each item is a sourced file exposing test_item, set_item, and unset_item.
# Dry-run by default; pass --apply to remove.

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=common.sh
. "$here/common.sh"

APPLY=0
for arg in "$@"; do
  case $arg in
    --apply) APPLY=1 ;;
    *)
      echo "cleanup: unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

items_dir="$here/items/macos"
shopt -s nullglob

changed=0
absent=0
failed=0

cask_installed() { brew list --cask "$1" >/dev/null 2>&1; }
formula_installed() { brew list --formula "$1" >/dev/null 2>&1; }
remove_cask() { brew uninstall --cask "$1"; }
remove_formula() { brew uninstall "$1"; }

run_item() {
  local file=$1
  local name=${file##*/}
  name=${name%.sh}

  # Item functions share this shell scope; drop the previous item's.
  unset -f test_item set_item unset_item 2>/dev/null || true
  if ! . "$file"; then
    warn "$name: failed to load"
    failed=$((failed + 1))
    return
  fi

  local fn
  for fn in test_item set_item unset_item; do
    if ! declare -F "$fn" >/dev/null; then
      warn "$name: missing $fn()"
      failed=$((failed + 1))
      return
    fi
  done

  if test_item; then
    say "ok           $name"
    absent=$((absent + 1))
    return
  fi

  if (( ! APPLY )); then
    say "pending      $name"
    changed=$((changed + 1))
    return
  fi

  if set_item; then
    say "applied      $name"
    changed=$((changed + 1))
  else
    warn "$name: apply failed"
    failed=$((failed + 1))
  fi
}

found=0
for file in "$items_dir"/*.sh; do
  [[ ${file##*/} == _* ]] && continue
  found=$((found + 1))
  run_item "$file"
done

if (( found == 0 )); then
  say "No cleanup items configured in items/macos."
  exit 0
fi

say ""
if (( APPLY )); then
  say "Applied $changed item(s); $absent already ok; $failed failed."
else
  say "$changed item(s) pending; $absent already ok; $failed failed."
  say "Re-run with --apply to apply them."
fi

(( failed == 0 )) || exit 1
