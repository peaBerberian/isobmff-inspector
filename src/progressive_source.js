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
        const reader =
          /** @type {ReadableStream<import("./types.js").ISOBMFFByteChunk>} */ (
            input
          ).getReader();
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
