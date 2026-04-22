import {
  be2toi,
  be3toi,
  be4toi,
  be5toi,
  be8toi,
  bytesToHex,
  utf8ToStr,
} from "./bytes.js";

/**
 * Create object allowing to easily parse an ISOBMFF box.
 *
 * The BufferReader saves in its state the current offset after each method
 * call, allowing to easily parse contiguous bytes in box parsers.
 *
 * @param {Uint8Array} buffer
 * @returns {import("../types.js").BufferReader}
 */
export default function createBufferReader(buffer) {
  let currentOffset = 0;

  /**
   * @param {string} hex
   * @returns {bigint}
   */
  function hexToBigInt(hex) {
    return BigInt(`0x${hex}`);
  }

  /**
   * @param {number} nbBytes
   * @returns {void}
   */
  function ensureAvailable(nbBytes) {
    if (!Number.isInteger(nbBytes) || nbBytes < 0) {
      throw new Error(`Cannot read an invalid byte length: ${nbBytes}.`);
    }

    const remaining = buffer.length - currentOffset;
    if (remaining < nbBytes) {
      throw new Error(
        `Cannot read ${nbBytes} byte(s) at offset ${currentOffset}: ` +
          `only ${Math.max(0, remaining)} byte(s) remaining.`,
      );
    }
  }

  return {
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
    bytesToInt(nbBytes) {
      ensureAvailable(nbBytes);
      let res;
      switch (nbBytes) {
        case 1:
          res = buffer[currentOffset];
          break;
        case 2:
          res = be2toi(buffer, currentOffset);
          break;
        case 3:
          res = be3toi(buffer, currentOffset);
          break;
        case 4:
          res = be4toi(buffer, currentOffset);
          break;
        case 5:
          res = be5toi(buffer, currentOffset);
          break;
        case 8:
          res = be8toi(buffer, currentOffset);
          break;
        default:
          throw new Error("not implemented yet.");
      }

      currentOffset += nbBytes;
      return res;
    },

    /**
     * Returns the N next bytes into a string of Hexadecimal values.
     * @param {number} nbBytes
     * @returns {string}
     */
    bytesToHex(nbBytes) {
      ensureAvailable(nbBytes);
      const res = bytesToHex(buffer, currentOffset, nbBytes);
      currentOffset += nbBytes;
      return res;
    },

    /**
     * Returns the next 8 bytes as an exact unsigned 64-bit bigint.
     * @returns {bigint}
     */
    bytesToUint64BigInt() {
      ensureAvailable(8);
      const hex = bytesToHex(buffer, currentOffset, 8);
      currentOffset += 8;
      return hexToBigInt(hex);
    },

    /**
     * Returns the next 8 bytes as an exact signed 64-bit bigint.
     * @returns {bigint}
     */
    bytesToInt64BigInt() {
      ensureAvailable(8);
      const hex = bytesToHex(buffer, currentOffset, 8);
      currentOffset += 8;
      return BigInt.asIntN(64, hexToBigInt(hex));
    },

    /**
     * Returns the N next bytes into a string.
     * @param {number} nbBytes
     * @returns {string}
     */
    readAsUtf8(nbBytes) {
      ensureAvailable(nbBytes);
      const res = utf8ToStr(buffer, currentOffset, nbBytes);
      currentOffset += nbBytes;
      return res;
    },

    /**
     * Convert a FourCC (4-byte code) into a readable representation.
     *
     * If all bytes are printable ASCII (0x20–0x7E), returns a string.
     * Otherwise, returns a number (unsigned 32-bit integer).
     * @returns {string|number}
     * Printable ASCII string OR unsigned 32-bit integer.
     */
    readFourCc() {
      ensureAvailable(4);

      // Check if all bytes are printable ASCII
      let isPrintable = true;
      for (let i = currentOffset; i < currentOffset + 4; i++) {
        const b = buffer[i];
        if (b < 0x20 || b > 0x7e) {
          isPrintable = false;
          break;
        }
      }
      currentOffset += 4;

      if (isPrintable) {
        // Convert to string, same codes as UTF-16's lower byte
        return String.fromCharCode(
          buffer[currentOffset - 4],
          buffer[currentOffset - 3],
          buffer[currentOffset - 2],
          buffer[currentOffset - 1],
        );
      }

      // Fallback: return unsigned 32-bit number (big-endian)
      return be4toi(buffer, currentOffset - 4);
    },

    /**
     * Returns the total length of the buffer
     * @returns {number}
     */
    getTotalLength() {
      return buffer.length;
    },

    /**
     * Returns the length of the buffer which is not yet parsed.
     * @returns {number}
     */
    getRemainingLength() {
      return Math.max(0, buffer.length - currentOffset);
    },

    /**
     * Returns true if this buffer is entirely parsed.
     * @returns {boolean}
     */
    isFinished() {
      return buffer.length <= currentOffset;
    },
  };
}
