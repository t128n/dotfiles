#!/usr/bin/env sh
# Install the apps declared under apps/ for macOS or Linux.
#
# Check without changing the machine:
#   sh scripts/apps/apply.sh --check
#
# Apply:
#   sh scripts/apps/apply.sh

set -eu

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
root=$(CDPATH= cd -- "$here/../.." && pwd)

check=0
for arg in "$@"; do
  case $arg in
    --check) check=1 ;;
    *)
      echo "apps: unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

if [ "$(uname -s)" = "Darwin" ]; then
  file="$root/apps/macos/Brewfile"
  if ! command -v brew >/dev/null 2>&1; then
    echo "apps: Homebrew is required to apply $file" >&2
    exit 1
  fi
  if [ ! -f "$file" ]; then
    echo "apps: $file does not exist" >&2
    exit 1
  fi
  if [ "$check" -eq 1 ]; then
    exec brew bundle check --file "$file"
  fi
  exec brew bundle install --file "$file"
fi

# Linux: use the manager that owns this machine and read its package list.
if command -v apt-get >/dev/null 2>&1; then
  manager=apt
elif command -v dnf >/dev/null 2>&1; then
  manager=dnf
elif command -v pacman >/dev/null 2>&1; then
  manager=pacman
else
  echo "apps: no supported package manager (apt, dnf, pacman)" >&2
  exit 1
fi

file="$root/apps/linux/$manager.txt"
if [ ! -f "$file" ]; then
  echo "apps: no declarations for $manager ($file); nothing to do"
  exit 0
fi

installed() {
  case $manager in
    apt) dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q 'install ok installed' ;;
    dnf) rpm -q "$1" >/dev/null 2>&1 ;;
    pacman) pacman -Q "$1" >/dev/null 2>&1 ;;
  esac
}

missing=
while IFS= read -r package || [ -n "$package" ]; do
  package=${package%%#*}
  package=$(printf '%s' "$package" | tr -d '[:space:]')
  [ -z "$package" ] && continue
  if ! installed "$package"; then
    missing="$missing $package"
  fi
done < "$file"

if [ -z "$missing" ]; then
  echo "apps: all $manager packages are installed"
  exit 0
fi

if [ "$check" -eq 1 ]; then
  echo "apps: missing ($manager):$missing"
  exit 1
fi

echo "apps: installing ($manager):$missing"
case $manager in
  apt)
    sudo apt-get update
    # shellcheck disable=SC2086 # package names are split intentionally
    sudo apt-get install -y $missing
    ;;
  dnf)
    # shellcheck disable=SC2086
    sudo dnf install -y $missing
    ;;
  pacman)
    # shellcheck disable=SC2086
    sudo pacman -S --needed --noconfirm $missing
    ;;
esac
