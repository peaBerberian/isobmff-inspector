# Changelog

## Unreleased

### Changes

- 64-bit fields are now `BigInt`, not JS `number`, to be able to express all possible values without loss
- Minimum supported version is now es2017
- Don't `console.warn` when issues are discovered. Use the new `errors` optional property linked to parsed boxes instead.
- Some properties of the boxes `avcC`, `mdhd`, `mvhd`, `sidx`, `tkhd` and `trex` had their casing modified to be closer to how the specifications named them (e.g. `profile_compatibility`, not `profileCompatibility`)

### Features

- It's now possible to give a `File`, `Blob`, `Response`, `ReadableStream`, `Iterable`/`AsyncIterable` and most other kinds of "progressive" data inputs to the main API in which case it will return a `Promise` and parse those efficiently (not keeping the full data in-memory)
- Add `parseBoxEvents` exported function for an alternative event-based progressive API
- Add parser for the following boxes: `btrt`, `colr`, `encv`, `frma`, `ID32`, `iods`, `leva`, `pasp`, `schi`, `schm`, `sinf`, `tenc`, `trep` and `uuid`
- Add optional `errors` property to parsed box objects to signal for recoverable or unrecoverable errors that happened when parsing them
- Add typings (not of boxes themselves for now)
- Add textual description to all boxes
