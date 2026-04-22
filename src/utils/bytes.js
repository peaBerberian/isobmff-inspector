const textDecoder = new TextDecoder();

/**
 * Translate groups of 2 big-endian bytes to Integer (from 0 up to 65535).
 * @param {ArrayLike<number>} bytes
 * @param {number} off - The offset (from the start of the given array)
 * @returns {number}
 */
export function be2toi(bytes, off) {
  return (bytes[0 + off] << 8) + bytes[1 + off];
}

/**
 * Translate groups of 3 big-endian bytes to Integer.
 * @param {ArrayLike<number>} bytes
 * @param {number} off - The offset (from the start of the given array)
 * @returns {number}
 */
export function be3toi(bytes, off) {
  return (
    bytes[0 + off] * 0x0010000 + bytes[1 + off] * 0x0000100 + bytes[2 + off]
  );
}

/**
 * Translate groups of 4 big-endian bytes to Integer.
 * @param {ArrayLike<number>} bytes
 * @param {number} off - The offset (from the start of the given array)
 * @returns {number}
 */
export function be4toi(bytes, off) {
  return (
    bytes[0 + off] * 0x1000000 +
    bytes[1 + off] * 0x0010000 +
    bytes[2 + off] * 0x0000100 +
    bytes[3 + off]
  );
}

/**
 * Translate groups of 4 big-endian bytes to Integer.
 * @param {ArrayLike<number>} bytes
 * @param {number} off - The offset (from the start of the given array)
 * @returns {number}
 */
export function be5toi(bytes, off) {
  return (
    bytes[0 + off] * 0x100000000 +
    bytes[1 + off] * 0x001000000 +
    bytes[2 + off] * 0x000010000 +
    bytes[3 + off] * 0x000000100 +
    bytes[4 + off]
  );
}

/**
 * Translate groups of 8 big-endian bytes to Integer.
 * @param {ArrayLike<number>} bytes
 * @param {number} off - The offset (from the start of the given array)
 * @returns {number}
 */
export function be8toi(bytes, off) {
  return (
    (bytes[0 + off] * 0x1000000 +
      bytes[1 + off] * 0x0010000 +
      bytes[2 + off] * 0x0000100 +
      bytes[3 + off]) *
      0x100000000 +
    bytes[4 + off] * 0x1000000 +
    bytes[5 + off] * 0x0010000 +
    bytes[6 + off] * 0x0000100 +
    bytes[7 + off]
  );
}

/**
 * @param {Uint8Array} uint8arr
 * @param {number} off
 * @param {number} nbBytes
 * @returns {string}
 */
export function bytesToHex(uint8arr, off, nbBytes) {
  if (!uint8arr) {
    return "";
  }

  const arr = uint8arr.slice(off, nbBytes + off);
  let hexStr = "";
  for (let i = 0; i < arr.length; i++) {
    let hex = (arr[i] & 0xff).toString(16);
    hex = hex.length === 1 ? `0${hex}` : hex;
    hexStr += hex;
  }

  return hexStr.toUpperCase();
}

/**
 * @param {Uint8Array} uint8arr
 * @param {number} [off = 0]
 * @param {number} [nbBytes]
 * @returns {string}
 */
export function utf8ToStr(uint8arr, off = 0, nbBytes) {
  if (!uint8arr) {
    return "";
  }

  if (nbBytes === undefined) {
    if (off === 0) {
      return textDecoder.decode(uint8arr);
    }
    return textDecoder.decode(uint8arr.slice(off));
  }

  const arr = uint8arr.slice(off, nbBytes + off);
  return textDecoder.decode(arr);
}

/**
 * @param {ArrayBufferView} view
 * @returns {Uint8Array}
 */
export function viewToUint8Array(view) {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

/**
 * @param {unknown} value
 * @returns {value is ArrayBuffer | ArrayBufferView}
 */
export function isBufferSource(value) {
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

/**
 * @param {ArrayBuffer | ArrayBufferView} arr
 * @returns {Uint8Array}
 */
export function bufferSourceToUint8Array(arr) {
  if (arr instanceof Uint8Array) {
    return arr;
  }
  if (arr instanceof ArrayBuffer) {
    return new Uint8Array(arr);
  }
  return viewToUint8Array(arr);
}

/**
 * @param {unknown} chunk
 * @returns {Uint8Array}
 */
export function byteChunkToUint8Array(chunk) {
  if (chunk instanceof Uint8Array) {
    return chunk;
  }
  if (chunk instanceof ArrayBuffer) {
    return new Uint8Array(chunk);
  }
  if (ArrayBuffer.isView(chunk)) {
    return viewToUint8Array(chunk);
  }
  throw new Error(
    "Progressive ISOBMFF inputs must yield ArrayBuffer or TypedArray chunks.",
  );
}

/**
 * @param {AsyncIterable<unknown> | Iterable<unknown>} iterable
 * @returns {AsyncIterable<Uint8Array>}
 */
export function asyncByteIterable(iterable) {
  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of iterable) {
        yield byteChunkToUint8Array(chunk);
      }
    },
  };
}

/**
 * @param {unknown} input
 * @returns {AsyncIterable<Uint8Array> | undefined}
 */
export function getProgressiveSource(input) {
  if (input === null || input === undefined) {
    return undefined;
  }

  if (typeof input === "object" && "body" in input) {
    const body = /** @type {{ body?: unknown }} */ (input).body;
    if (body !== null && body !== undefined) {
      return getProgressiveSource(body);
    }
  }

  if (
    typeof input === "object" &&
    "getReader" in input &&
    typeof input.getReader === "function"
  ) {
    return {
      async *[Symbol.asyncIterator]() {
        const reader = /** @type {ReadableStream} */ (input).getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            yield byteChunkToUint8Array(value);
          }
        } finally {
          reader.releaseLock();
        }
      },
    };
  }

  if (
    typeof input === "object" &&
    Symbol.asyncIterator in input &&
    typeof input[Symbol.asyncIterator] === "function"
  ) {
    return asyncByteIterable(/** @type {AsyncIterable<unknown>} */ (input));
  }

  if (
    typeof input === "object" &&
    Symbol.iterator in input &&
    typeof input[Symbol.iterator] === "function"
  ) {
    return asyncByteIterable(/** @type {Iterable<unknown>} */ (input));
  }

  if (
    typeof input === "object" &&
    "stream" in input &&
    typeof input.stream === "function"
  ) {
    return getProgressiveSource(input.stream());
  }

  if (
    typeof input === "object" &&
    "arrayBuffer" in input &&
    typeof input.arrayBuffer === "function"
  ) {
    const arrayBuffer =
      /** @type {{ arrayBuffer: () => Promise<ArrayBuffer> }} */ (input)
        .arrayBuffer;
    return asyncByteIterable({
      async *[Symbol.asyncIterator]() {
        yield await arrayBuffer.call(input);
      },
    });
  }

  return undefined;
}
