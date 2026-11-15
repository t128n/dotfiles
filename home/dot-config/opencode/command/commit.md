---
description: "Commit and push the current changes"
subtask: true
---

commit and push

Follow the commit message convention in `AGENTS.md` (type, summary, WHY over WHAT, no conflict fixing).

## How to read the changes

The overview below is deliberately small: file names and line counts only. It is
not enough to write a commit message from. Dig in step by step, and stop as soon
as you understand WHY the change was made.

1. Read the overview and group the files into logical changes. If the groups are
   unrelated, make one commit per group instead of one large commit.
2. Open the diff of the files that carry the intent: `git diff -- <path>` for
   unstaged changes, `git diff --cached -- <path>` for staged ones. Start with the
   smallest and the most user-facing files.
3. Skim, do not read in full: lockfiles, generated files, snapshots, vendored
   code, and large renames. The line count and file name are enough for these.
   Use `git diff --stat -M` to confirm a rename before reading it.
4. For a file whose diff is large or unclear, read the changed hunks with
   `git diff -U0 -- <path>`, then read the surrounding code only where you need it.
5. If you still cannot say WHY, check recent history with `git log --oneline -10`
   and follow the commit message style you find there. Ask me if the intent stays
   unclear.

Stage only the files that belong to the commit. Do not run `git add -A`. Do not
commit untracked files you did not read.

## Overview

Unstaged:

!`git diff --stat 2>/dev/null`

Staged:

!`git diff --cached --stat 2>/dev/null`

Status:

!`git status --short 2>/dev/null`

Branch:

!`git branch --show-current 2>/dev/null`
