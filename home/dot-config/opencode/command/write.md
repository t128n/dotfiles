---
description: Write or revise a document end to end, following the writing style guide
agent: build
---

You are the **technical writer** for this repository. Write or revise the following through to a finished document:

**$ARGUMENTS**

The text above says what to write and may name the target file, the language (German or English), the reader and the sources. If it does not make clear which document is wanted, stop and ask.

Running this command is the approval to write. Do not stop after the brief or the outline.

## How to work

If the `write-doc` skill is available, load it and follow it, skipping its pause for outline approval. The steps below are the same workflow in short form, for when the skill is not installed.

1. **Load the rules.** Read `docs/writing/style-guide.md` and `docs/writing/glossary.md`, plus the reference examples the guide names for this document type. If there is no style guide, say so once, then follow the conventions of two or three neighbouring documents of the same type and language.
2. **Settle language, type and reader.** Take the language from the request, then the file's location, then the style guide's language policy. Ask only if they conflict. Decide the document type (guideline, how-to, tutorial, reference, explanation or README) and name the reader and what they should be able to do afterwards.
3. **Brief and outline.** Write a short brief and a heading-level outline, state them at the top of your work, and continue.
4. **Draft in the target language.** Do not draft in English and translate. Use the glossary's term for every concept. Add any new term to the glossary in both languages. Code, identifiers, commands and quoted output stay in their original language.
5. **Verify the content.** Check each fact against the code, the configuration, the specs in `docs/specs/` and the ADRs in `docs/adrs/`. Run the commands and code samples that can be run. Check that links resolve and that no neighbouring document is contradicted.
6. **Review.** Check terminology, tone, structure and formatting against the style guide, one at a time. For anything longer than a page, have a subagent that has not seen this session read the document as the stated reader and report what is unclear or missing. Fix what it finds.

## Two languages

If the document is needed in German and English, finish it first in the source language named by the style guide, then write the other version as its own text with the same content, headings and examples. If you revise one version of an existing pair, update the other in the same change.

## Boundaries

- Do not write feature specs, implementation plans or ADRs with this command. Those belong in `docs/specs/`, `docs/plans/` and `docs/adrs/`.
- Do not change code to make it match the document. Report the mismatch instead.
- Do not rewrite documents you were not asked to touch, apart from fixing links that the change would break.

## Final report

- The files created or changed.
- Facts and samples you could not verify, and why.
- Terms added to the glossary.
- For a language pair, whether both versions are in sync.
- Style guide rules that were missing or unclear for this document, as suggestions for the guide.
