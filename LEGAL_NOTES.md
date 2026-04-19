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

As of 2026-04-19, the repository appears to follow this rule set after shortening and paraphrasing descriptions that were missing or too close to specification-style wording.

The current `src/boxes` descriptions are mostly:

- short factual labels
- original paraphrases

This note is about reducing copyright risk for repository text. It is not legal advice.

## Description Sources

The brief top-level descriptions in `src/boxes` are checked against public references rather than copied from ISO text. Main sources:

- MP4 Registration Authority box, codec, and ID3v2 references: https://mp4ra.org/
- Bento4 parser source: https://github.com/axiomatic-systems/Bento4/tree/master/Source/C%2B%2B/Core
- FFmpeg MOV/ISOBMFF parser source: https://github.com/FFmpeg/FFmpeg/tree/master/libavformat
- FFmpeg/libav public notes for `avc1`/`avc3` and `hvc1`/`hev1` parameter-set placement.
- mp4parser BitRateBox docs for the public `btrt` field meaning.

These sources are used to verify factual meaning only. The committed descriptions are original, short paraphrases and should not be treated as quotations from the references.
