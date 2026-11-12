#!/usr/bin/env bash
# Shared helpers for the macOS and Linux cleanup executors.
#
# Sourced by macos.sh and linux.sh. Item files may call safe_path, path_exists,
# and remove_path; the executor owns reporting and exit codes.

say() { printf '%s\n' "$*"; }

warn() { printf 'cleanup: %s\n' "$*" >&2; }

# Strip trailing slashes so /home/me/ cannot bypass the $HOME check.
normalize_path() {
  local path=$1
  while [[ $path == */ && $path != / ]]; do
    path=${path%/}
  done
  printf '%s\n' "$path"
}

# safe_path PATH
#
# Return success only when PATH is safe to delete recursively. Rejects empty
# values, relative paths, the root and home directories, parent traversal, and
# single-segment system directories such as /usr.
safe_path() {
  local path
  path=$(normalize_path "$1")

  [[ -n $path ]] || return 1
  [[ $path == /* ]] || return 1
  [[ $path != / ]] || return 1
  [[ $path != "$HOME" ]] || return 1
  [[ $path != *..* ]] || return 1

  # Require at least two segments: /usr/local is allowed, /usr is not.
  [[ ${path#/} == */* ]] || return 1
  return 0
}

path_exists() {
  [[ -e $1 || -L $1 ]]
}

# remove_path PATH
#
# Delete PATH recursively after validating it. Returns non-zero for an unsafe
# path or a failed removal. Items call this from set_item.
remove_path() {
  local path=$1

  if ! safe_path "$path"; then
    warn "refusing unsafe path: $path"
    return 1
  fi

  rm -rf "$path"
}
