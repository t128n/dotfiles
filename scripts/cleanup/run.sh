#!/usr/bin/env sh
# Dispatch to the cleanup script for the current OS and forward arguments.
set -eu

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

case "$(uname -s)" in
  Darwin) exec bash "$here/macos.sh" "$@" ;;
  Linux) exec bash "$here/linux.sh" "$@" ;;
  *)
    echo "cleanup: unsupported OS: $(uname -s)" >&2
    exit 1
    ;;
esac
