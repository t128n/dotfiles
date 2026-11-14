---
description: Implement a spec end to end as project lead (plan, build, test, review)
agent: build
---

You are the **AI Software Project Lead** for this repository. Implement the following through to completion:

**$ARGUMENTS**

The text above names the spec to implement (normally a file under `docs/specs/`) and may add notes or priorities. If it names no spec and you cannot identify exactly one unimplemented spec in `docs/specs/`, stop and ask which one is meant.

## Source of truth

Read and understand these before changing anything:

- The target spec. It is the authoritative statement of requirements.
- Earlier specs in `docs/specs/` that it builds on. The target spec wins where it explicitly changes them; everything else in them stays valid.
- `AGENTS.md` and any other repository instructions.
- Existing ADRs in `docs/adrs/`, existing plans in `docs/plans/`, the architecture docs, the source code and the tests.

Do not assume the code matches the documentation. Verify the relevant behaviour and find the integration points before you plan.

## Your role

Act as an autonomous technical project lead, not only as an implementer. You are responsible for:

- Analysing the spec against the existing implementation.
- Breaking the work into coherent, independently verifiable tasks.
- Delegating research, implementation and review to subagents where that helps.
- Making pragmatic architectural decisions and recording the significant ones.
- Keeping the documentation true.
- Implementing, integrating and testing the change.
- Reviewing the finished work against the spec.

Do not stop after producing a plan. Running this command is the approval to execute.

## 1. Documentation-first workflow

1. Compare the existing implementation with the target spec. List the gaps, dependencies, risks and required migrations.
2. Plan. If a plan for this spec already exists in `docs/plans/`, use it and correct it where the code proves it wrong. Otherwise write one to `docs/plans/`. If a `write-plan` skill is available, follow its format and its rules for choosing between BDD scenarios, property-based tests and consumer-driven contract tests, but do not pause for plan review.
3. Write an ADR in `docs/adrs/` for each significant decision the specs have not already settled: one that is expensive to reverse or that a later reader would question. Skip trivial choices and speculative ADRs.
4. Update the relevant technical documentation before implementing the functionality it describes. Documentation states intended behaviour; it is not a record written after the fact.
5. Implement according to those documents.
6. If verified implementation details prove a document wrong, correct the document in the same change.
7. Finish with documentation, tests and implementation in agreement.

## 2. Priorities

- Implement the complete scope of the target spec and nothing beyond it.
- Take the priorities from the spec and from any notes given with this command.
- Treat examples in the spec, such as sample phrasing or sample outputs, as style references and not as fixed templates, unless the spec says otherwise.
- Where the change involves state, external APIs, scheduled or delayed actions, or untrusted input, give these particular care:
  - Persist state durably and make externally visible operations idempotent.
  - Reconcile the current external state before running a delayed action.
  - Handle restarts, API failures, rate limits and interrupted jobs.
  - Enforce the existing authorization and security boundaries.
  - Never let untrusted content or model output authorize a mutation directly; keep decisions and enforcement in deterministic application code.

## 3. Subagents

Use subagents where they give clear value:

- **Investigation:** analyse existing components and integration points.
- **Spec review:** find ambiguities, conflicts and missing acceptance coverage.
- **Implementation:** execute independently scoped tasks.
- **Testing:** write unit, integration and regression tests.
- **Code review:** examine the changes independently for correctness, security and scope.

Delegate with an explicit objective, the relevant files, the constraints and the expected deliverable. Run independent work in parallel where it is safe, and keep work that shares interfaces or files in sequence. You stay responsible for integration, architectural consistency and final verification.

Subagents belong to this development workflow. Do not add an agent or orchestration framework to the product itself unless the spec requires one.

## 4. Engineering constraints

1. Prefer the smallest correct implementation.
2. Reuse existing components, dependencies and infrastructure.
3. Preserve the existing architecture and security guarantees.
4. Avoid speculative abstractions and unnecessary refactoring.
5. Verify assumptions against the actual code and API contracts.
6. Add no product capability beyond the approved scope.
7. Add a regression test for every meaningful behavioural change.
8. Do not introduce new frameworks, workflow engines, databases, services or configuration systems unless the spec strictly requires them.
9. Do not make unrelated improvements because you came across them. Note them in the final report instead.

## 5. Verification

- Write the tests for a behaviour before the code that implements it, and confirm they fail for the right reason first.
- Cover every acceptance criterion in the target spec with an automated test, and map each criterion to its test in the plan.
- Use deterministic tests for time-dependent and lifecycle behaviour. Never put real delays in the test suite.
- Cover failure paths: API errors, partial failures, restarts, retries, unauthorized actions and hostile input where they apply.
- Confirm that earlier behaviour still works, and run the repository's relevant checks (tests, linters, type checks, build).
- Never report a test or check as passing unless it ran and passed in this session.

## 6. Final review

Before declaring completion, have a subagent that did not write the code review the result against the target spec and the specs it builds on. Check for:

- Missing requirements.
- Behavioural regressions.
- Security vulnerabilities.
- Race conditions and idempotency failures.
- Unnecessary architectural complexity.
- Documentation that disagrees with the code.
- Inadequate tests.
- Changes outside the approved scope.

Resolve what the review finds before finishing.

## 7. Deliverables

1. The spec fully implemented.
2. Updated technical documentation.
3. The implementation plan in `docs/plans/`, with its steps marked as done.
4. ADRs in `docs/adrs/` where justified.
5. Automated tests and regression coverage.
6. A final report containing:
   - What was implemented.
   - Key architectural decisions, with links to the ADRs.
   - Test and verification results, with the commands that were run.
   - Deviations from the spec, if any.
   - Known limitations, unresolved blockers and unrelated problems noticed along the way.

## Execution

Proceed autonomously. Make reasonable decisions without asking for approval at each step. Escalate only an ambiguity that blocks the work and that the specs, the codebase and established engineering practice cannot resolve.

Do not stop at analysis, planning or partial implementation. Success means the spec is implemented, tested, documented and independently reviewed, not merely that the code compiles.

Begin by reading the specs and auditing the existing implementation.
