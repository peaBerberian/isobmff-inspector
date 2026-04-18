import {
  be2toi,
  be3toi,
  be4toi,
  be5toi,
  be8toi,
  betoa,
  bytesToHex,
} from "./bytes.js";

/**
 * Create object allowing to easily parse an ISOBMFF box.
 *
 * The BufferReader saves in its state the current offset after each method
 * call, allowing to easily parse contiguous bytes in box parsers.
 *
 * @param {Uint8Array} buffer
 * @returns {Object}
 */
export default function createBufferReader(buffer) {
  let currentOffset = 0;

  function hexToDecimalString(hex) {
    const digits = [0];

    for (let i = 0; i < hex.length; i++) {
      let carry = Number.parseInt(hex[i], 16);

      for (let j = 0; j < digits.length; j++) {
        const value = digits[j] * 16 + carry;
        digits[j] = value % 10;
        carry = Math.floor(value / 10);
      }

      while (carry > 0) {
        digits.push(carry % 10);
        carry = Math.floor(carry / 10);
      }
    }

    return digits.reverse().join("");
  }

  function twosComplementHexToAbsHex(hex) {
    let carry = 1;
    let ret = "";

    for (let i = hex.length - 1; i >= 0; i--) {
      let value = 15 - Number.parseInt(hex[i], 16) + carry;
      if (value >= 16) {
        value -= 16;
        carry = 1;
      } else {
        carry = 0;
      }
      ret = value.toString(16) + ret;
    }

    const normalized = ret.replace(/^0+/, "");
    return normalized === "" ? "0" : normalized;
  }

  function parseHex64ToSafeNumber(hex) {
    const paddedHex = hex.padStart(16, "0");
    const high = Number.parseInt(paddedHex.slice(0, 8), 16);
    const low = Number.parseInt(paddedHex.slice(8), 16);

    if (high > 0x1fffff) {
      return;
    }

    return high * 0x100000000 + low;
  }

  return {
    /**
     * Returns the N next bytes, as a single number.
     *
     * /!\ only work for now for 1, 2, 3, 4, 5 or 8 bytes.
     * TODO Define a more global solution.
     *
     * /!\ Depending on the size of the number, it may be larger than JS'
     * limit.
     *
     * @param {number} nb
     * @returns {number}
     */
    bytesToInt(nbBytes) {
      if (this.getRemainingLength() < nbBytes) {
        return;
      }
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
     * @param {number}
     * @returns {string}
     */
    bytesToHex(nbBytes) {
      if (this.getRemainingLength() < nbBytes) {
        return;
      }
      const res = bytesToHex(buffer, currentOffset, nbBytes);
      currentOffset += nbBytes;
      return res;
    },

    /**
     * Returns the next 8 bytes as an exact unsigned 64-bit decimal string.
     * @returns {string}
     */
    bytesToUint64String() {
      if (this.getRemainingLength() < 8) {
        return;
      }
      const hex = bytesToHex(buffer, currentOffset, 8);
      currentOffset += 8;
      return hexToDecimalString(hex);
    },

    /**
     * Returns the next 8 bytes as an exact signed 64-bit decimal string.
     * @returns {string}
     */
    bytesToInt64String() {
      if (this.getRemainingLength() < 8) {
        return;
      }
      const hex = bytesToHex(buffer, currentOffset, 8);
      currentOffset += 8;

      const firstNibble = Number.parseInt(hex[0], 16);
      if (firstNibble < 8) {
        return hexToDecimalString(hex);
      }

      const absoluteHex = twosComplementHexToAbsHex(hex);
      return `-${hexToDecimalString(absoluteHex)}`;
    },

    /**
     * Returns the next 8 bytes as either a safe JS number or an exact
     * unsigned 64-bit decimal string.
     * @returns {number|string}
     */
    bytesToUint64() {
      if (this.getRemainingLength() < 8) {
        return;
      }
      const hex = bytesToHex(buffer, currentOffset, 8);
      currentOffset += 8;

      const numericValue = parseHex64ToSafeNumber(hex);
      return numericValue !== undefined
        ? numericValue
        : hexToDecimalString(hex);
    },

    /**
     * Returns the next 8 bytes as either a safe JS number or an exact
     * signed 64-bit decimal string.
     * @returns {number|string}
     */
    bytesToInt64() {
      if (this.getRemainingLength() < 8) {
        return;
      }
      const hex = bytesToHex(buffer, currentOffset, 8);
      currentOffset += 8;

      const firstNibble = Number.parseInt(hex[0], 16);
      if (firstNibble < 8) {
        const numericValue = parseHex64ToSafeNumber(hex);
        return numericValue !== undefined
          ? numericValue
          : hexToDecimalString(hex);
      }

      const absoluteHex = twosComplementHexToAbsHex(hex);
      const numericValue = parseHex64ToSafeNumber(absoluteHex);
      return numericValue !== undefined
        ? -numericValue
        : `-${hexToDecimalString(absoluteHex)}`;
    },

    /**
     * Returns the N next bytes into a string.
     * @param {number}
     * @returns {string}
     */
    bytesToASCII(nbBytes) {
      if (this.getRemainingLength() < nbBytes) {
        return;
      }
      const res = betoa(buffer, currentOffset, nbBytes);

      currentOffset += nbBytes;
      return res;
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
