import {
  fixedPointField,
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
 * parsers can migrate incrementally. New parsers can use emitting methods like
 * uint(), hex(), fixedPoint() and field(); emitted fields are available even if
 * parsing later throws.
 *
 * @param {Uint8Array} buffer
 * @returns {import("./types.js").BoxReader}
 */
export default function createBoxReader(buffer) {
  const reader = BufferReader(buffer);
  /** @type {import("./types.js").ParsedBoxValue[]} */
  const values = [];

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

  return {
    ...reader,

    field: addField,

    uint(key, nbBytes, meta) {
      return /** @type {number} */ (
        addField(key, reader.bytesToInt(nbBytes), meta)
      );
    },

    uint64(key, meta) {
      return /** @type {bigint} */ (
        addField(key, reader.bytesToUint64BigInt(), meta)
      );
    },

    int64(key, meta) {
      return /** @type {bigint} */ (
        addField(key, reader.bytesToInt64BigInt(), meta)
      );
    },

    hex(key, nbBytes, meta) {
      return /** @type {string} */ (
        addField(key, reader.bytesToHex(nbBytes), meta)
      );
    },

    ascii(key, nbBytes, meta) {
      return /** @type {string} */ (
        addField(key, reader.bytesToASCII(nbBytes), meta)
      );
    },

    fixedPoint(key, nbBytes, fractionalBits, format, meta) {
      const value = fixedPointField(
        reader.bytesToInt(nbBytes),
        fractionalBits,
        format,
      );
      addField(key, value, meta);
      return value;
    },

    signedFixedPoint(key, nbBytes, bits, fractionalBits, format, meta) {
      const value = signedFixedPointField(
        reader.bytesToInt(nbBytes),
        bits,
        fractionalBits,
        format,
      );
      addField(key, value, meta);
      return value;
    },

    macDate(key, nbBytes, meta) {
      const raw =
        nbBytes === 8
          ? reader.bytesToUint64BigInt()
          : reader.bytesToInt(nbBytes);
      const value = macDateField(raw);
      addField(key, value, meta);
      return value;
    },

    getValues() {
      return values.slice();
    },
  };
}
