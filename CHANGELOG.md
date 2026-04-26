# Changelog

## Unreleased

### Features

- Add `options` to `parseEvents` to add the possibility to be notified of raw payload bytes when they are parsed
- Each `field` now also have optional `offset` and `byteLength` properties to indicate where in the whole file such field was extracted exactly
- Parsed boxes in both `"full"` and `"simple"` formats now expose `actualSize`, the number of bytes actually present in the input for that box. `size` remains the header-declared size, including `0` for `extendsToEnd` boxes.

### Bug fixes

- `extendsToEnd` boxes wrongly had their `size` set to their actual size where as per the API it should have been the announced size (so `0`). Now it is `0` and `actualSize` reflect its true size.
- `hdlr`'s `handler_type` is now handled like any fourCC (`string` when printable, `number` when not) instead of always a `number`
- `ftyp`'s and `styp`'s `compatible_brandes` is now handled as an array of fourCC (`string` when printable, `number` when not) instead of always a single comma-separated `string`

## v0.4.0 (2026-04-23)

### Changes

- Fields that are semantically binary data (e.g. `pssh` payload) now have the `"bytes"` kind, not the `"string"` kind, and are only upper-case hexa-encoded binary data

### Features

- add parsing for boxes: `enca`, `ac-3`, `av01`, `cdsc`, `cslg`, `dac3`, `data`, `dec3`, `dOps`, `ec-3`, `elng`, `emsg`, `font`, `hind`, `hint`, `hmhd`, `keys`, `mfra`, `mfro`, `nmhd`, `Opus`, `padb`, `prft`, `sbgp`, `senc`, `sgpd`, `stdp`, `sthd`, `stsh`, `stz2`, `subt`, `tfra`, `tref`, `vdep` and `vplx`
- Handle `ilst`"dynamic" sub-boxes
- improve parsing of `colr` by parsing more colour types' information
- be more resilient to `vmhd` boxes which wrongly do not have their mvhd flag to `1` (just emit a warning)

### Bug fixes

- Fix `hdlr` sometimes having a null byte at the end of `name`

## v0.3.0 (2026-04-20)

### Changes

- The main API now returns a `Promise`. Use exported `parseBuffer` function for synchronous buffer parsing.
- In parsed boxes, `values[].name` is now `values[].key` to better reflect the original spec's canonical keys exactly
- Reformat `values` (fields from boxes) to permit richer types with added metadata (e.g. Date which have their original timestamp, associated epoch and corresponding `Date` JS Object). If using this library previously, re-check the API (indicated in README.md)
- 64-bit fields are now `BigInt`, not JS `number`, to be able to express all possible values without loss
- In parsed boxes, `alias` (the fourCC, e.g. `mdat`) is now called `type`
- In parsed boxes, `uuid` boxes now have a `uuid` hex property instead of a `subtype` property being an Array of numbers.
- Minimum supported version is now es2017
- Don't `console.warn` when issues are discovered. Use the new `issues` property linked to parsed boxes instead.
- Some properties of the boxes `avcC`, `mdhd`, `mvhd`, `sidx`, `tkhd` and `trex` had their casing modified to be closer to how the specifications named them (e.g. `profile_compatibility`, not `profileCompatibility`)

### Features

- It's now possible to give a `File`, `Blob`, `Response`, `ReadableStream`, `Iterable`/`AsyncIterable` and most other kinds of "progressive" data inputs to the main API, which parses those efficiently without keeping the full data in memory.
- Add `parseEvents` exported function for an alternative event-based progressive API
- Add `parseBuffer` exported function for synchronous buffer parsing
- Add parser for the following boxes: `btrt`, `colr`, `encv`, `frma`, `ID32`, `iods`, `leva`, `pasp`, `schi`, `schm`, `sinf`, `tenc`, `trep` and `uuid`
- Complete parsing of `iods`, `leva`, `tkhd` and `urn ` boxes
- This tool can now be used as a CLI directly, e.g. `npx isobmff-inspector my-mp4-file`
- Add `--simple` flag to CLI for a new "simple" non-verbose format
- Add `format` option to methods to allow to enable the new "simple" format as output
- Add `offset`, `headerSize`, and `sizeField` properties to parsed box objects and `box-start` events.
- Add `issues` property to parsed box objects to signal warnings or errors that happened when parsing them
- Add typings (not of boxes themselves for now)
- Add textual description to all boxes
- An error happening while parsing a box can (depending on the box) now keep what has been parsed until that point.
