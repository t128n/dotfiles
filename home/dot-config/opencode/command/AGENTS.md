# OpenCode Command Notes

- Keep `!` commands POSIX-shell compatible like the existing files (`2>/dev/null`, `||`); do not mix PowerShell syntax.
- Do not hardcode `origin/dev`; resolve the default branch with `gh repo view` and fall back to `git symbolic-ref` or `origin/main`.
