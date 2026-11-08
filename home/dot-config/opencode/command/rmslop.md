---
description: Remove AI code slop
---

Target repository:
!`gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || git config --get remote.origin.url`

Base ref:
!`branch=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null); [ -n "$branch" ] || branch=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@'); echo "origin/${branch:-main}"`

Fetch the latest remote refs, then review the diff from the base ref above to `HEAD`. Use the printed ref in place of `<base-ref>`:

```sh
git fetch --prune
git diff <base-ref>...HEAD
```

Remove all AI-generated slop introduced in this branch. This includes:

- Extra comments that a human would not add or that are inconsistent with the rest of the file
- Extra defensive checks or try/catch blocks that are abnormal for that area of the codebase, especially if the code path is trusted or validated
- Casts to `any` to work around type issues
- Any other style that is inconsistent with the file
- Unnecessary emoji

Report at the end with only a 1-3 sentence summary of what you changed.
