# OpenCode Command Notes

- Keep `!` commands POSIX-shell compatible like the existing files (`2>/dev/null`, `||`); do not mix PowerShell syntax.
- Do not hardcode `origin/dev`; resolve the default branch with `gh repo view` and fall back to `git symbolic-ref` or `origin/main`.
- Name commands `<verb>-<object>` with the verbs `write-`, `review-`, `find-`, `remove-` or `setup-`. A single git verb such as `commit` is also fine. Do not abbreviate. A command that wraps a skill has the same name as that skill (see `skills/AGENTS.md` in the skills repo).
- Frontmatter: `description` in double quotes, one sentence, sentence case, no trailing period.
