---
description: Review what would ship through role-based lenses
agent: plan
---

Run a pre-ship review with the `lenses` skill on: $ARGUMENTS

If no scope is given, use everything that would ship from the current branch: commits since the merge base with the default branch, plus staged, unstaged, and untracked work.

Default branch commit:

!`branch=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null); [ -n "$branch" ] || branch=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@'); if [ -n "$branch" ]; then for ref in "origin/$branch" "$branch"; do sha=$(git rev-parse --verify --quiet "$ref") && { echo "$sha"; break; }; done; fi`

Pick the lenses that fit the change. Use all ten only if the arguments say so. Report only; do not edit files or change git state.
