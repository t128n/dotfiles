---
description: Review documents against the writing style guide and glossary
---

Review the following documentation for consistency and correctness:

**$ARGUMENTS**

The text above names the files or folders to review. If it names none, ask which documents are meant. Report findings only. Edit files only if the text above explicitly asks for fixes.

## Before reviewing

1. Read `docs/writing/style-guide.md` and `docs/writing/glossary.md`. They are the standard. If there is no style guide, say so, and review against the conventions of the best neighbouring documents, naming which ones you used.
2. Identify each document's language (German or English) and its type (guideline, how-to, tutorial, reference, explanation or README). Apply the style guide's rules for that language only.
3. If several documents are in scope, review them in parallel with one subagent per document or folder, each given the style guide, the glossary and this checklist. Merge the findings yourself.

## What to check

- **Terminology:** every concept uses the glossary's term for the document's language. Flag variants, terms the glossary lists as not to be used, and terms missing from the glossary.
- **Tone and address:** how the reader is addressed, formality, and the voice traits from the style guide. For German also the form of address, inclusive language, and the handling of English terms, including articles and compound spelling.
- **Language:** one language per document. Flag mixed-language passages, and sentences that read as translated because they follow the other language's sentence structure. Code, identifiers and commands are expected to stay in their original language.
- **Structure:** the sections the style guide defines for this type are present and in order. Flag documents that mix types, such as a how-to that turns into an explanation.
- **Content:** claims that disagree with the code, the specs in `docs/specs/` or the ADRs in `docs/adrs/`. Commands and samples that look outdated; run them where that is safe and read-only. Broken links. Contradictions with neighbouring documents.
- **Clarity:** steps a reader could not follow, undefined terms, missing prerequisites, rules given without a reason.
- **Language pairs:** if a German or English counterpart exists, compare headings, content and examples and report where the two have drifted apart, and which one looks newer.

## Optional English baseline

If the `writing-guidelines` skill from vercel-labs/agent-skills is installed, you may also run it on the English documents as a general plain-writing baseline. Report its findings under a separate heading. The project's style guide wins wherever the two disagree, and that skill is not applied to German documents.

## Output

Group findings by file, most serious first, one line each:

`path:line - [severity] problem - suggested fix`

Use three severities:

- **wrong:** factually incorrect, broken, or contradicts another document.
- **inconsistent:** breaks a style guide or glossary rule. Name the rule.
- **unclear:** follows the rules, but a reader would stumble.

After the findings, add:

- A two or three sentence overall judgement per document.
- Patterns that repeat across documents. These are candidates for a prose linter rule or a style guide clarification.
- Questions the style guide does not answer but should.

Do not report matters of personal taste that no rule covers. If a document is fine, say so in one line.
