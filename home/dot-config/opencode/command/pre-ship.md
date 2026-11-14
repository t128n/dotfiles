---
description: Run all 10 pre-ship role audits in parallel
agent: plan
subagent: false
---

Run the full pre-ship gate on the target scope: $ARGUMENTS

You are the orchestrator. Resolve the scope once, launch one read-only `explore` subagent per role in parallel, then merge their reports. Report only; do not edit files or change git state.

If no scope is given, audit everything that would ship from the current branch: committed changes since the merge base with the default branch, plus staged, unstaged, and untracked work.

## 1. Resolve the scope

Default branch commit:

!`branch=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null); [ -n "$branch" ] || branch=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@'); if [ -n "$branch" ]; then for ref in "origin/$branch" "$branch"; do sha=$(git rev-parse --verify --quiet "$ref") && { echo "$sha"; break; }; done; fi`

Interpret `$ARGUMENTS` in this order:

- **Empty:** run `GIT_TERMINAL_PROMPT=0 git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch --prune`. If it fails, continue with local refs and say the base may be stale. Use the commit above if present; otherwise use the nearest local `main` or `master`; otherwise use `HEAD`. The base is `git merge-base <base-ref> HEAD`.
- **A path** such as `src/checkout/`: audit the changes that touch that path in the default scope. Read surrounding files when a finding depends on them.
- **A commit range** such as `main..HEAD`: use it verbatim, and also inspect staged, unstaged, and untracked changes against `HEAD`.
- **A single ref** such as `HEAD~3`: audit `git diff <ref>`, including uncommitted changes.

List changed files with `git -c core.quotePath=false diff --name-status <base>` and `git status --short --untracked-files=all`. Read every untracked file in scope in full; `git diff` does not include them. If the change exceeds roughly 40 files or 1500 changed lines, audit it in batches by path and state that the audit was sampled. Exclude lockfiles, generated output, `dist/`, `vendor/`, and `node_modules/` unless the change is specifically about them.

Never quote a secret value. Mask it (`sk-…ab12`) and report only the path and kind of secret. Skip `.env`, private keys, credentials, and token files.

Print the resolved base commit or range, the changed files, and `git diff --stat=200` before launching subagents.

If the directory is not a git repository, or the scope has no changes, say so and stop. If the argument is ambiguous, choose the interpretation that covers more shippable code and state the choice.

## 2. Launch the roles

Launch 10 `explore` subagents in one turn so they run concurrently. If `explore` is unavailable, use `general` and repeat the read-only contract. Give every subagent:

- The resolved base commit or range, the scope path filter, and the changed-file list.
- The untracked-file list from `git status --short --untracked-files=all`.
- Its role line below.
- The common contract below.

Do not paste the whole diff into a subagent prompt. Tell it to run `git diff <base> -- <path>` itself, to read untracked files in full, and not to fetch again.

Roles:

1. **attacker** — How would you break, bypass, or abuse this? Check trust boundaries, authentication and authorization, injection, unsafe deserialization, secrets, dependency changes, and error paths that leak.
2. **slow-network** — What happens on bad 3G? Check retry storms, missing idempotency keys, timeouts, duplicate or hanging requests, optimistic UI that lies, and recovery when the connection returns.
3. **first-time-user** — Where will a first-time user get stuck? Check empty states, defaults, error messages, onboarding, destructive actions, and paths with no data, no permissions, or an expired session.
4. **finance** — What does this cost at 100x traffic? Check compute, third-party API calls, storage, egress, retries, idle resources, unbounded loops, missing caching, and retention without a cap.
5. **maintainer** — What hurts to change in 6 months? Check coupling, hidden state, ownership, duplicated logic, missing tests, a second way to do the same thing, and migration and rollback paths.
6. **dba** — Which query dies first? Check N+1 patterns, unbounded scans, missing indexes, lock duration, transaction scope, and migration rollback safety. If there is no database surface, say so.
7. **screen-reader** — What can't a screen-reader user reach? Check keyboard reachability, focus order, labels, ARIA, contrast, motion, custom controls, modals, and visual-only state changes. If there is no UI, say so.
8. **tokyo** — What breaks across time zones and languages? Check time zones, locale formatting and sorting, currencies, text direction, CJK input and truncation, date boundaries, daylight saving, and non-ASCII paths.
9. **on-call** — What pages me at 3 AM? Check silent failures, telemetry, retries, timeouts, circuit breakers, partial failure, alert coverage, and whether an operator can identify and stop the problem.
10. **privacy** — What personal data are we storing, and why? Check collection, logging, storage, third-party sharing, minimization, retention, deletion, consent, and identifiers or secrets in logs and prompts.

Common contract for every subagent:

- Verify each finding in the code before reporting it. A hunch is not a finding.
- Cite `file:line` and quote the relevant line or hunk.
- Say whether the change introduced the problem or exposed a pre-existing one; report a pre-existing problem only if it blocks shipping or the change makes it worse.
- Use only `Blocker`, `High`, or `Medium`; drop anything lower.
- If the role has no real finding, say so in one line.
- Do not report formatting or style nits.
- Never quote a secret value; mask it and report only the path and kind.
- Read-only: do not modify files or git state, and do not run mutating commands.
- Do not ask questions.
- Return: scope inspected, findings (one line each in the format below), and what was clean.

`path:line - [role] problem - why it matters - concrete fix`

## 3. Merge and rank

When all ten have reported, deduplicate findings, keep the clearest evidence, and rank:

- **Blocker:** data loss, security or privacy breach, broken build or test, or an outage this change would cause.
- **High:** a likely production incident under realistic conditions, an unauthorized access path, a missing test for critical behaviour, or a flow that is unusable with assistive technology.
- **Medium:** a real cost, reliability, UX, or maintainability problem that should be fixed soon but does not block the release.

If any role fails to start, errors, times out, or returns no report, list it as **not audited** and do not issue a `ship` verdict. Drop findings you cannot substantiate. If roles disagree, say so and explain which evidence wins.

## Output

Start with the verdict: **ship**, **ship with follow-ups**, or **do not ship**, and one sentence why.

Then list findings, most severe first, under the three severity headings:

`path:line - [role] problem - why it matters - concrete fix`

After the findings:

- Coverage: one line per role, marked reported, clean, or **not audited**.
- Pre-existing problems the change exposed, kept separate.
- What this audit did not cover.

If there are no findings, say so in one line and give the verdict. Do not invent work to look thorough.
