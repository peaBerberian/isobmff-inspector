# Changelog

## Unreleased

### Changes

- 64-bit fields are now `BigInt`, not JS `number`, to be able to express all possible values without loss
- Minimum supported version is now es2017
- Don't `console.warn` when issues are discovered. Use the new `errors` optional property linked to parsed boxes instead.

### Features

- Add parser for the following boxes: `btrt`, `colr`, `encv`, `frma`, `ID32`, `iods`, `leva`, `pasp`, `schi`, `schm`, `sinf`, `tenc`, `trep` and `uuid`
- Add optional `errors` property to parsed box objects to signal for recoverable or unrecoverable errors that happened when parsing them
- Add typings (not of boxes themselves for now)
- Add textual description to all boxes
