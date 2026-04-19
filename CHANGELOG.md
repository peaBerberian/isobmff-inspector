# Changelog

## Unreleased

### Changes

- 64-bit fields are now `BigInt`, not JS `number`, to be able to express all possible values without loss
- Minimum supported version is now es2017
- Don't `console.warn` when issues are discovered in profit of the new error API

### Features

- Add parser for the following boxes: `btrt`, `colr`, `encv`, `frma`, `ID32`, `iods`, `leva`, `pasp`, `schi`, `schm`, `sinf`, `tenc`, `trep` and `uuid`
- Add optional `errors` property to parsed box objects for major and minor error that arised when parsing them
- Add typings (not of boxes themselves for now)
- Add textual description to all boxes
