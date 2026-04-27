# AGENTS.md

## Project shape

- `src/main.js` is the public entrypoint.
- `src/api/` contains the parsing APIs:
  - `index.js` exposes `parse`, `parseBuffer`, and `parseEvents`
  - `streaming_parser.js` handles progressive/event-based parsing
  - `simple_format.js` projects parsed boxes to the lighter CLI-friendly shape
- `src/BoxReader.js` is the core helper used by box parsers to read typed fields and report issues.
- `src/boxes/` is the box-definition registry. Each file typically defines one box parser/container, and `src/boxes/index.js` wires them together.
- `cli/cli.js` is the Node CLI source.
- `scripts/build.mjs` produces `dist/`.
- `test/` contains the Node test suite plus committed MP4 and dump fixtures.

## Working conventions

- Source is plain ESM JavaScript with JSDoc typing. Follow the existing style.
- Prefer extending the parser through `src/boxes/*.js` definitions and `BoxReader` helpers instead of ad hoc parsing logic elsewhere.
- When adding a new box definition, register it in `src/boxes/index.js` and provide a non-empty `description`; `test/box-definitions.test.mjs` enforces that.
- Preserve progressive parsing behavior. Large payload boxes such as `mdat` are intentionally skipped or streamed instead of buffered wholesale.
- Keep public API compatibility in mind. The package surface is validated by `test/build-output.test.mjs`.

## Build and validation

- Install dependencies with `npm install`.
- Run the main checks with `npm run check`.
- Useful narrower commands:
  - `npm test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`

## Generated output

- Treat `dist/` as generated output from `npm run build`.
- Prefer editing source files under `src/`, `cli/`, and `scripts/`; only update `dist/` by rebuilding when needed.

## Tests and fixtures

- Dump compatibility tests use fixture pairs under `test/fixtures/mp4s/` and `test/fixtures/dumps/`.
- If parser behavior changes for supported boxes, update or extend tests to cover both full and simple output when relevant.
