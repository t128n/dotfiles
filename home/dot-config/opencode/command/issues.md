---
description: "Find issue(s) on github"
---

Target repository:
!`gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || git config --get remote.origin.url`

Search through existing issues in this repository using the `gh` CLI for:

$ARGUMENTS

Execution requirements:

- Search both open and closed issues (`--state all`).
- Inspect title, body, and comments for matching error messages, symptoms, or feature requests.
- Fetch fields using `--json number,title,url,state,body` to ensure issue links are exact.

Output format:

- Issue number, state (open/closed), and title
- Explanation of relevance to the query
- Direct issue URL

If no clear matches are found, state that explicitly.
