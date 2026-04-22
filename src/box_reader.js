import {
  bitsField,
  fixedPointField,
  flagsField,
  macDateField,
  parsedBoxValue,
  signedFixedPointField,
} from "./fields.js";
import BufferReader from "./utils/buffer_reader.js";

/**
 * @param {string | import("./types.js").ParsedBoxFieldMetadata | undefined} meta
 * @returns {string | undefined}
 */
function getDescription(meta) {
  if (typeof meta === "string") {
    return meta;
  }
  return meta?.description;
}

/**
 * Create a field-aware box reader.
 *
 * It intentionally keeps the BufferReader read-only methods so existing box
 * parsers can migrate incrementally. read* methods consume input without
 * emitting fields. field* methods consume input and append public fields.
 * addField() appends a derived field without consuming input. Emitted fields
 * are available even if parsing later throws.
 *
 * @param {Uint8Array} buffer
 * @template {{ [k: string]: unknown }} T
 * @returns {import("./types.js").BoxReader<T>}
 */
export default function createBoxReader(buffer) {
  const reader = BufferReader(buffer);
  /** @type {import("./types.js").ParsedBoxValue[]} */
  const values = [];
  /** @type {import("./types.js").ParsedBoxIssue[]} */
  const issues = [];

  /**
   * @param {string} key
   * @param {unknown} value
   * @param {string | import("./types.js").ParsedBoxFieldMetadata=} meta
   * @returns {unknown}
   */
  function addField(key, value, meta) {
    values.push(parsedBoxValue(key, value, getDescription(meta)));
    return value;
  }

  /**
   * @param {"warning" | "error"} severity
   * @param {string} message
   * @returns {void}
   */
  function addIssue(severity, message) {
    issues.push({ severity, message });
  }

  return /** @type {import("./types.js").BoxReader<T>} */ ({
    ...reader,

    addField,
    addIssue,

    readUint: reader.bytesToInt,
    readUint64: reader.bytesToUint64BigInt,
    readInt64: reader.bytesToInt64BigInt,
    readHex: reader.bytesToHex,
    readAscii: reader.bytesToASCII,

    fieldUint(key, nbBytes, meta) {
      return /** @type {number} */ (
        addField(key, reader.bytesToInt(nbBytes), meta)
      );
    },

    fieldUint64(key, meta) {
      return /** @type {bigint} */ (
        addField(key, reader.bytesToUint64BigInt(), meta)
      );
    },

    fieldInt64(key, meta) {
      return /** @type {bigint} */ (
        addField(key, reader.bytesToInt64BigInt(), meta)
      );
    },

    fieldHex(key, nbBytes, meta) {
      return /** @type {string} */ (
        addField(key, reader.bytesToHex(nbBytes), meta)
      );
    },

    fieldAscii(key, nbBytes, meta) {
      return /** @type {string} */ (
        addField(key, reader.bytesToASCII(nbBytes), meta)
      );
    },

    fieldFixedPoint(key, nbBytes, fractionalBits, format, meta) {
      const value = fixedPointField(
        reader.bytesToInt(nbBytes),
        nbBytes * 8,
        fractionalBits,
        format,
      );
      addField(key, value, meta);
      return value;
    },

    fieldSignedFixedPoint(key, nbBytes, bits, fractionalBits, format, meta) {
      const value = signedFixedPointField(
        reader.bytesToInt(nbBytes),
        bits,
        fractionalBits,
        format,
      );
      addField(key, value, meta);
      return value;
    },

    fieldMacDate(key, nbBytes, meta) {
      const raw =
        nbBytes === 8
          ? reader.bytesToUint64BigInt()
          : reader.bytesToInt(nbBytes);
      const value = macDateField(raw);
      addField(key, value, meta);
      return value;
    },

    fieldBits(key, nbBytes, parts, meta) {
      const value = bitsField(reader.bytesToInt(nbBytes), nbBytes * 8, parts);
      addField(key, value, meta);
      return value.value;
    },

    fieldFlags(key, nbBytes, flags, meta) {
      const value = flagsField(reader.bytesToInt(nbBytes), nbBytes * 8, flags);
      addField(key, value, meta);
      return value.value;
    },

    getValues() {
      return values.slice();
    },

    getIssues() {
      return issues.slice();
    },
  });
}
