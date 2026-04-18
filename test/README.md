Dump-based compatibility tests use committed fixture pairs in:
- `test/fixtures/mp4s/`
- `test/fixtures/dumps/`

The comparison is normalized:
- only parser-supported ISOBMFF boxes participate in tree matching
- only curated fields with known semantic alignment are asserted per box
- unsupported dump subtrees are ignored unless a supported parent box has a
  dedicated comparator
