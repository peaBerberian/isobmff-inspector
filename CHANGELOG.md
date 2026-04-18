# Changelog

## Unreleased

### Changes

- Minimum supported version is now es2017
- 64-bit fields are now `BigInt`, not JS `number`, to be able to express all possible values without loss

### Features

- Add parser for the following boxes: `btrt`, `colr`, `encv`, `frma`, `ID32`, `iods`, `leva`, `pasp`, `schi`, `schm`, `sinf`, `tenc`, `trep` and `uuid`
