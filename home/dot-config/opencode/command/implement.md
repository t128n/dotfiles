---
description: Implement a spec end to end as project lead (plan, build, test, review)
agent: build
---

You are the project lead for this repository. Implement this through to completion:

**$ARGUMENTS**

The text names the spec to implement (normally a file under `docs/specs/`) and may add notes or priorities. If it names no spec and you cannot identify exactly one unimplemented spec in `docs/specs/`, stop and ask.

Running this command is the approval to execute. Do not stop after the plan.

## Source of truth

Read the target spec, the earlier specs it builds on (the target wins where it explicitly changes them), `AGENTS.md`, and existing ADRs, plans and architecture docs in `docs/`. Then verify against the actual code and tests. Do not assume the code matches the documentation.

## Workflow

1. **Gap analysis.** Compare the spec with the implementation. List gaps, risks, integration points and migrations.
2. **Plan.** Reuse a plan in `docs/plans/` if one exists and correct it where the code proves it wrong. Otherwise write one with the `planning` skill (including its choice of BDD scenarios, property-based tests and contract tests), without pausing for review. Write an ADR in `docs/adrs/` only for a significant decision the specs have not settled.
3. **Docs first.** Update the technical documentation to state the intended behavior before implementing it. If verified details prove a document wrong, fix it in the same change.
4. **Tests first.** Write the tests for each behavior before the code and confirm they fail for the right reason. Cover every acceptance criterion with an automated test, map each to its test in the plan, and cover the relevant failure paths. Use deterministic tests for time and lifecycle; no real delays.
5. **Implement.** Smallest correct change, reusing existing components and dependencies. Add no capability, framework, service or configuration system beyond the spec. Do not make unrelated improvements; note them in the final report. For state, external APIs, delayed actions or untrusted input, apply `engineering-principles`. Never let untrusted content or model output authorize a mutation; keep decisions in deterministic code.
6. **Verify.** Run the repository's tests, linters, type checks and build. Confirm earlier behavior still works. Never report a check as passing unless it ran and passed in this session.
7. **Independent review.** Have a subagent that did not write the code review the result against the spec for missing requirements, regressions, security, races and idempotency, unnecessary complexity, docs that disagree with the code, weak tests and out-of-scope changes. Resolve what it finds.

Use subagents where they give clear value (investigation, implementation of independent tasks, review). Give each an explicit objective, relevant files and constraints, and keep work that shares files in sequence. You stay responsible for integration and final verification.

## Final report

- What was implemented, and key decisions with ADR links.
- Verification results with the commands that were run.
- Deviations from the spec, known limitations, blockers, and unrelated problems noticed.

Proceed autonomously. Escalate only an ambiguity that blocks the work and that the specs, the code and established practice cannot resolve.
