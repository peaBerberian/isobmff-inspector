# Legal Notes

This project publishes its own parser code under this [LICENSE](./LICENSE).

The low-risk position for this repository is:

- Implement the ISOBMFF format behavior in original code.
- Use box names, fourccs, field names, and short factual labels as compatibility references.
- Write `description` text in original wording.
- Avoid reproducing standard text, tables, diagrams, or long normative excerpts.

## Drafting Rules

When adding or editing box metadata:

- Treat ISO/IEC standards and third-party parser code as references, not as copy sources.
- Paraphrase descriptions in short factual language.
- Do not paste normative requirements, field tables, or distinctive wording from standards.
- Keep descriptions focused on what a box or field represents, not on reproducing the standard's explanation.
- If a longer quotation from a standard would be useful, link or cite the source instead of copying it into the repository.

Examples of generally safe content in this repo:

- `name` values for boxes and fields
- `description` values such as "Movie duration in the movie timescale."
- factual notes about units, timestamps, containment, or playback purpose

Examples to avoid:

- verbatim or near-verbatim standard prose
- copied tables of fields, bit layouts, or semantics from ISO/IEC publications
- large excerpts from third-party documentation

## Current State

As of 2026-04-18, the repository appears to follow this rule set after shortening and paraphrasing a small number of descriptions that were too close to specification-style wording.

The current `src/boxes` descriptions are mostly:

- empty
- short factual labels
- original paraphrases

This note is about reducing copyright risk for repository text. It is not legal advice.
