import {
  bitsField,
  bytesField,
  fixedPointField,
  flagsField,
  macDateField,
  parsedBoxValue,
  signedFixedPointField,
  toSignedInt,
} from "./fields.js";
import {
  be2toi,
  be3toi,
  be4toi,
  be5toi,
  bytesToHex,
  utf8ToStr,
} from "./utils/bytes.js";

export { BoxReader };

/**
 * Create a field-aware box reader.
 *
 * The idea is to instanciate the `BoxReader` with a buffer that is already
 * bounded to a box's content start (after its size and name) and ending at its
 * content's end.
 *
 * The `BoxReader` has methods allowing to define the fields of the current box
 * or just to parse the next N bytes into the wanted format.
 *
 * The BoxReader is generic over the struct associated to a box's data. Methods
 * properly typecheck that added fields respect that type.
 *
 * @template {{ [k: string]: unknown }} T
 */
export default class BoxReader {
  /** @type {Uint8Array} */
  #buffer;
  /** @type {import("./types.js").ParsedBoxValue[]} */
  #values = [];
  /** @type {import("./types.js").ParsedBoxIssue[]} */
  #issues = [];
  /**
   * Current byte position in #buffer, starting at 0 and ending at
   * `#buffer.length`.
   *
   * Each read operation will advance this cursor in #buffer.
   */
  #currentOffset = 0;

  /**
   * @param {Uint8Array} buffer
   */
  constructor(buffer) {
    this.#buffer = buffer;
  }

  /**
   * Get the number of bytes that are not yet read.
   * @returns {number}
   */
  getRemainingLength() {
    return Math.max(0, this.#buffer.length - this.#currentOffset);
  }

  /**
   * If `true`, the current box is already fully parsed.
   * @returns {boolean}
   */
  isFinished() {
    return this.#buffer.length <= this.#currentOffset;
  }

  /**
   * Returns the total length of the current box in bytes.
   * @returns {number}
   */
  getTotalLength() {
    return this.#buffer.length;
  }

  /**
   * Read the next `nbBytes` bytes, convert it into the corresponding
   * unsigned integer and store it as a field named `key` for the current box.
   *
   * Throws if less that `nbBytes` bytes remain in the current box.
   *
   * Throws if 8 bytes or more is read. If you need to read 8 bytes, use
   * `fieldUint64` (which creates a bigint).
   *
   * @template {NumberKeys<T>} K
   * @param {K} key
   * @param {number} nbBytes
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {number}
   */
  fieldUint(key, nbBytes, meta) {
    return this.addField(key, this.#bytesToInt(nbBytes), meta);
  }

  /**
   * Read the next 8 bytes, convert it into the corresponding
   * unsigned bigint and store it as a field named `key` for the current box.
   *
   * Throws if less that 8 bytes remain in the current box.
   *
   * @template {BigIntKeys<T>} K
   * @param {K} key
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {bigint}
   */
  fieldUint64(key, meta) {
    return this.addField(key, this.#bytesToUint64BigInt(), meta);
  }

  /**
   * Read the next 8 bytes, convert it into the corresponding
   * **signed** bigint and store it as a field named `key` for the current box.
   *
   * Throws if less that 8 bytes remain in the current box.
   *
   * @template {BigIntKeys<T>} K
   * @param {K} key
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {bigint}
   */
  fieldInt64(key, meta) {
    return this.addField(key, this.#bytesToInt64BigInt(), meta);
  }

  /**
   * @template {NumberKeys<T>} K
   * @param {K} key
   * @param {number} nbBytes
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {number}
   */
  fieldSignedInt(key, nbBytes, meta) {
    return this.addField(
      key,
      toSignedInt(this.#bytesToInt(nbBytes), nbBytes * 8),
      meta,
    );
  }

  /**
   * @template {BytesKeys<T>} K
   * @param {K} key
   * @param {number} nbBytes
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {Uint8Array}
   */
  fieldBytes(key, nbBytes, meta) {
    this.#ensureAvailable(nbBytes);
    const offset = this.#currentOffset;
    const value = this.#buffer.slice(offset, offset + nbBytes);
    const description = typeof meta === "string" ? meta : meta?.description;
    this.#values.push(
      parsedBoxValue(
        key,
        bytesField(this.#buffer, offset, nbBytes),
        description,
      ),
    );
    this.#currentOffset += nbBytes;
    return value;
  }

  /**
   * @template {StringKeys<T>} K
   * @param {K} key
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {string}
   */
  fieldNullTerminatedAscii(key, meta) {
    return this.addField(key, this.#parseNullTerminatedAscii(), meta);
  }

  /**
   * @template {StringKeys<T>} K
   * @param {K} key
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {string}
   */
  fieldNullTerminatedUtf8(key, meta) {
    return this.addField(key, this.#parseNullTerminatedUtf8(), meta);
  }

  /**
   * Decode the next 4 bytes into a string if printable ASCII, or the
   * corresponding 32 bit integer if not, and set it as a field named
   * `key` on the current box.
   *
   * Throws if less than 4 are remaining in the buffer.
   *
   * @template {StringKeys<T>} K
   * @param {K} key
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {string|number}
   */
  fieldFourCc(key, meta) {
    return this.addField(key, this.#readFourCc(), meta);
  }

  /**
   * @template {FixedPointKeys<T>} K
   * @param {K} key
   * @param {number} nbBytes
   * @param {number} fractionalBits
   * @param {string} format
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {import("./types.js").ParsedFixedPointField}
   */
  fieldFixedPoint(key, nbBytes, fractionalBits, format, meta) {
    const value = fixedPointField(
      this.#bytesToInt(nbBytes),
      nbBytes * 8,
      fractionalBits,
      format,
    );
    this.addField(key, value, meta);
    return value;
  }

  /**
   * @template {FixedPointKeys<T>} K
   * @param {K} key
   * @param {number} nbBytes
   * @param {number} bits
   * @param {number} fractionalBits
   * @param {string} format
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {import("./types.js").ParsedFixedPointField}
   */
  fieldSignedFixedPoint(key, nbBytes, bits, fractionalBits, format, meta) {
    const value = signedFixedPointField(
      this.#bytesToInt(nbBytes),
      bits,
      fractionalBits,
      format,
    );
    this.addField(key, value, meta);
    return value;
  }

  /**
   * @template {DateKeys<T>} K
   * @param {K} key
   * @param {number} nbBytes
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {import("./types.js").ParsedDateField}
   */
  fieldMacDate(key, nbBytes, meta) {
    const raw =
      nbBytes === 8 ? this.#bytesToUint64BigInt() : this.#bytesToInt(nbBytes);
    const value = macDateField(raw);
    this.addField(key, value, meta);
    return value;
  }

  /**
   * @template {BitsKeys<T>} K
   * @param {K} key
   * @param {number} nbBytes
   * @param {import("./types.js").ParsedBitsFieldPartDefinition[]} parts
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {number}
   */
  fieldBits(key, nbBytes, parts, meta) {
    const value = bitsField(this.#bytesToInt(nbBytes), nbBytes * 8, parts);
    this.addField(key, value, meta);
    return value.value;
  }

  /**
   * @template {FlagsKeys<T>} K
   * @param {K} key
   * @param {number} nbBytes
   * @param {Record<string, number>} flags
   * @param {string|ParsedBoxFieldMetadata} [meta]
   * @returns {number}
   */
  fieldFlags(key, nbBytes, flags, meta) {
    const value = flagsField(this.#bytesToInt(nbBytes), nbBytes * 8, flags);
    this.addField(key, value, meta);
    return value.value;
  }

  /**
   * @template V
   * @template {KeysForValue<T, V>} K
   * @param {K} key
   * @param {V} value
   * @param {string | ParsedBoxFieldMetadata=} [meta]
   * @returns {V}
   */
  addField(key, value, meta) {
    const description = typeof meta === "string" ? meta : meta?.description;
    this.#values.push(parsedBoxValue(key, value, description));
    return value;
  }

  /**
   * @param {"warning" | "error"} severity
   * @param {string} message
   * @returns {void}
   */
  addIssue(severity, message) {
    this.#issues.push({ severity, message });
  }

  /**
   * Read the next `nbBytes` bytes and returns the corresponding
   * unsigned integer.
   *
   * Throws if less that `nbBytes` bytes remain in the current box.
   *
   * Throws if 8 bytes or more is read. If you need to read 8 bytes, use
   * `fieldUint64` (which creates a bigint).
   * @param {number} nbBytes
   * @returns {number}
   */
  readUint(nbBytes) {
    return this.#bytesToInt(nbBytes);
  }

  /**
   * Read the next 8 bytes and returns the corresponding bigint.
   *
   * Throws if less that 8 bytes remain in the current box.
   *
   * @returns {bigint}
   */
  readUint64() {
    return this.#bytesToUint64BigInt();
  }

  /**
   * Parse the next 4 bytes as a **signed** (two's complement) 64-bit integer
   * into a bigint.
   *
   * Throws if less than 8 bytes are remaining in the buffer.
   *
   * @returns {bigint}
   */
  readInt64() {
    return this.#bytesToInt64BigInt();
  }

  /**
   * Read the next bytes and return it as an Uint8Array.
   *
   * Throws if less than `nbBytes` bytes are remaining in the buffer.
   *
   * @param {number} nbBytes
   * @returns {Uint8Array}
   */
  readBytes(nbBytes) {
    this.#ensureAvailable(nbBytes);
    const res = this.#buffer.slice(
      this.#currentOffset,
      this.#currentOffset + nbBytes,
    );
    this.#currentOffset += nbBytes;
    return res;
  }

  /**
   * Decode the next `nbBytes` as UTF-8 text.
   *
   * Throws if less than `nbBytes` bytes are remaining in the buffer.
   *
   * @param {number} nbBytes
   * @returns {string}
   */
  readAsUtf8(nbBytes) {
    return this.#readAsUtf8(nbBytes);
  }

  /**
   * Decode the next 4 bytes into a string if printable ASCII, or the
   * corresponding 32 bit integer if not.
   *
   * Throws if less than 4 are remaining in the buffer.
   *
   * @returns {string|number}
   */
  readFourCc() {
    return this.#readFourCc();
  }

  /** @returns {import("./types.js").ParsedBoxValue[]} */
  getValues() {
    return this.#values.slice();
  }

  /** @returns {import("./types.js").ParsedBoxIssue[]} */
  getIssues() {
    return this.#issues.slice();
  }

  // Now, private methods implementing the logic

  /**
   * @param {number} nbBytes
   * @returns {void}
   */
  #ensureAvailable(nbBytes) {
    if (!Number.isInteger(nbBytes) || nbBytes < 0) {
      throw new Error(`Cannot read an invalid byte length: ${nbBytes}.`);
    }

    const remaining = this.#buffer.length - this.#currentOffset;
    if (remaining < nbBytes) {
      throw new Error(
        `Cannot read ${nbBytes} byte(s) at offset ${this.#currentOffset}: ` +
          `only ${Math.max(0, remaining)} byte(s) remaining.`,
      );
    }
  }

  /**
   * Returns the N next bytes, as a single number.
   *
   * /!\ only work for now for 1, 2, 3, 4, 5 or 8 bytes.
   *
   * /!\ Depending on the size of the number, it may be larger than JS'
   * limit.
   *
   * @param {number} nbBytes
   * @returns {number}
   */
  #bytesToInt(nbBytes) {
    this.#ensureAvailable(nbBytes);
    let res;
    switch (nbBytes) {
      case 1:
        res = this.#buffer[this.#currentOffset];
        break;
      case 2:
        res = be2toi(this.#buffer, this.#currentOffset);
        break;
      case 3:
        res = be3toi(this.#buffer, this.#currentOffset);
        break;
      case 4:
        res = be4toi(this.#buffer, this.#currentOffset);
        break;
      case 5:
        res = be5toi(this.#buffer, this.#currentOffset);
        break;
      default:
        throw new Error("not implemented yet.");
    }

    this.#currentOffset += nbBytes;
    return res;
  }

  /**
   * Returns the next 8 bytes as an exact unsigned 64-bit bigint.
   * @returns {bigint}
   */
  #bytesToUint64BigInt() {
    this.#ensureAvailable(8);
    const hex = bytesToHex(this.#buffer, this.#currentOffset, 8);
    const toBigint = hexToBigInt(hex);
    this.#currentOffset += 8;
    return toBigint;
  }

  /**
   * Returns the next 8 bytes as an exact signed 64-bit bigint.
   * @returns {bigint}
   */
  #bytesToInt64BigInt() {
    this.#ensureAvailable(8);
    const hex = bytesToHex(this.#buffer, this.#currentOffset, 8);

    const toBigInt = BigInt.asIntN(64, hexToBigInt(hex));
    this.#currentOffset += 8;
    return toBigInt;
  }

  /**
   * Returns the N next bytes into a string.
   * @param {number} nbBytes
   * @returns {string}
   */
  #readAsUtf8(nbBytes) {
    this.#ensureAvailable(nbBytes);
    const res = utf8ToStr(this.#buffer, this.#currentOffset, nbBytes);
    this.#currentOffset += nbBytes;
    return res;
  }
  #readFourCc() {
    this.#ensureAvailable(4);

    // Check if all bytes are printable ASCII
    let isPrintable = true;
    for (let i = this.#currentOffset; i < this.#currentOffset + 4; i++) {
      const b = this.#buffer[i];
      if (b < 0x20 || b > 0x7e) {
        isPrintable = false;
        break;
      }
    }

    const res = isPrintable
      ? // Convert to string, same codes as UTF-16's lower byte
        String.fromCharCode(
          this.#buffer[this.#currentOffset],
          this.#buffer[this.#currentOffset + 1],
          this.#buffer[this.#currentOffset + 2],
          this.#buffer[this.#currentOffset + 3],
        )
      : // Fallback: return unsigned 32-bit number (big-endian)
        be4toi(this.#buffer, this.#currentOffset);

    this.#currentOffset += 4;
    return res;
  }

  /**
   * @returns {string}
   */
  #parseNullTerminatedAscii() {
    const bytes = [];
    while (!this.isFinished()) {
      const value = this.readUint(1);
      if (value === 0) {
        break;
      }
      bytes.push(value);
    }
    // 128-255 become latin-1. Good enough for now
    return String.fromCharCode.apply(null, bytes);
  }

  /**
   * @returns {string}
   */
  #parseNullTerminatedUtf8() {
    const bytes = [];
    while (!this.isFinished()) {
      const value = this.readUint(1);
      if (value === 0) {
        break;
      }
      bytes.push(value);
    }
    return utf8ToStr(new Uint8Array(bytes));
  }
}

/**
 * @param {string} hex
 * @returns {bigint}
 */
function hexToBigInt(hex) {
  return BigInt(`0x${hex}`);
}

/**
 * @typedef {object} ParsedBoxFieldMetadata
 * @property {string=} description
 */

/**
 * @template T
 * @template V
 * @typedef {{ [K in Extract<keyof T, string>]: V extends T[K] ? K : never }[Extract<keyof T, string>]} KeysForValue
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: number extends T[K] ? K : never }[Extract<keyof T, string>]} NumberKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: bigint extends T[K] ? K : never }[Extract<keyof T, string>]} BigIntKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: string extends T[K] ? K : never }[Extract<keyof T, string>]} StringKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: Uint8Array extends T[K] ? K : never }[Extract<keyof T, string>]} BytesKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: import("./types.js").ParsedFixedPointField extends T[K] ? K : never }[Extract<keyof T, string>]} FixedPointKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: import("./types.js").ParsedDateField extends T[K] ? K : never }[Extract<keyof T, string>]} DateKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: import("./types.js").ParsedBitsField extends T[K] ? K : never }[Extract<keyof T, string>]} BitsKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: import("./types.js").ParsedFlagsField extends T[K] ? K : never }[Extract<keyof T, string>]} FlagsKeys
 */
