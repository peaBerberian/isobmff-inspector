# Changelog

## Unreleased

### Changes

- 64-bit fields are now `BigInt`, not JS `number`, to be able to express all possible values without loss
- The main API now always returns a `Promise`, including for `ArrayBuffer` and TypedArray inputs. Use `parseBuffer` for synchronous buffer parsing.
- In parsed boxes, `alias` (the fourCC, e.g. `mdat`) is now called `type`
- In parsed boxes, `uuid` boxes now have a `uuid` hex property instead of a `subtype` property being an Array of numbers.
- In parsed boxes, `values[].name` is now `values[].key` to better illustrate that they are supposed to mirror the original spec's canonical keys exactly
- Minimum supported version is now es2017
- Don't `console.warn` when issues are discovered. Use the new `issues` property linked to parsed boxes instead.
- Some properties of the boxes `avcC`, `mdhd`, `mvhd`, `sidx`, `tkhd` and `trex` had their casing modified to be closer to how the specifications named them (e.g. `profile_compatibility`, not `profileCompatibility`)

### Features

- It's now possible to give a `File`, `Blob`, `Response`, `ReadableStream`, `Iterable`/`AsyncIterable` and most other kinds of "progressive" data inputs to the main API, which parses those efficiently without keeping the full data in memory.
- Add `parseEvents` exported function for an alternative event-based progressive API
- Add `parseBuffer` exported function for synchronous buffer parsing
- Add parser for the following boxes: `btrt`, `colr`, `encv`, `frma`, `ID32`, `iods`, `leva`, `pasp`, `schi`, `schm`, `sinf`, `tenc`, `trep` and `uuid`
- Add `offset`, `headerSize`, and `sizeField` properties to parsed box objects and `box-start` events.
- Add `issues` property to parsed box objects to signal warnings or errors that happened when parsing them
- Add typings (not of boxes themselves for now)
- Add textual description to all boxes
