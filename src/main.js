import definitions from "./boxes/index.js";
import BufferReader from "./utils/buffer_reader.js";
import { be4toi, be8toi, betoa } from "./utils/bytes.js";

const MIN_BOX_HEADER_SIZE = 8;
const LARGE_BOX_SIZE_BYTES = 8;
const UUID_SUBTYPE_BYTES = 16;

/**
 * @param {unknown} error
 * @returns {string}
 */
function formatErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {import("./types.js").ParsedBox} box
 * @param {boolean} recoverable
 * @param {string} message
 * @returns {void}
 */
function addBoxError(box, recoverable, message) {
  if (!box.errors) {
    box.errors = [];
  }
  box.errors.push({ recoverable, message });
}

/**
 * @param {import("./types.js").ParsedBox} atomObject
 * @param {Uint8Array} content
 * @returns {void}
 */
function parseBoxContent(atomObject, content) {
  const config = definitions[atomObject.alias];
  if (!config) {
    return;
  }

  const contentInfos = config.content
    ? config.content.reduce(
        /**
         * @param {Record<string, { name: string, description: string }>} acc
         * @param {import("./types.js").BoxContentEntry} el
         */
        (acc, el) => {
          acc[el.key] = {
            name: el.name || "",
            description: el.description || "",
          };
          return acc;
        },
        {},
      )
    : /** @type {Record<string, { name: string, description: string }>} */ ({});

  atomObject.name = config.name || "";
  atomObject.description = config.description || "";
  const hasChildren = !!config.container;
  /** @type {Uint8Array | undefined} */
  let contentForChildren;

  if (typeof config.parser === "function") {
    const parserReader = BufferReader(content);
    /** @type {import("./types.js").BoxParserFields} */
    let result = {};
    try {
      result = /** @type {import("./types.js").BoxParserFields} */ (
        config.parser(parserReader)
      );
    } catch (e) {
      addBoxError(atomObject, false, formatErrorMessage(e));
    }

    if (hasChildren) {
      const remaining = parserReader.getRemainingLength();
      contentForChildren = content.slice(content.length - remaining);
    } else if (!parserReader.isFinished()) {
      addBoxError(
        atomObject,
        true,
        `Parser left ${parserReader.getRemainingLength()} byte(s) unread.`,
      );
    }

    delete result.__data__;
    Object.keys(result).forEach((key) => {
      const infos = contentInfos[key] || {};

      if (!infos.name) {
        infos.name = key;
      }

      atomObject.values.push(
        Object.assign(
          {
            value: result[key],
          },
          infos,
        ),
      );
    });
  }

  if (hasChildren) {
    atomObject.children = recursiveParseBoxes(contentForChildren || content);
  }
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function shouldReadContent(name) {
  const config = definitions[name];
  return !!(config && (config.parser || config.container));
}

/**
 * @param {ArrayBufferView} view
 * @returns {Uint8Array}
 */
function viewToUint8Array(view) {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

/**
 * @param {unknown} value
 * @returns {value is ArrayBuffer | ArrayBufferView}
 */
function isBufferSource(value) {
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

/**
 * @param {ArrayBuffer | ArrayBufferView} arr
 * @returns {Uint8Array}
 */
function bufferSourceToUint8Array(arr) {
  if (arr instanceof Uint8Array) {
    return arr;
  }
  if (arr instanceof ArrayBuffer) {
    return new Uint8Array(arr);
  }
  return viewToUint8Array(arr);
}

/**
 * Parse recursively ISOBMFF Uint8Array.
 * @param {Uint8Array} arr
 * @returns {import("./types.js").ParsedBox[]}
 */
function recursiveParseBoxes(arr) {
  let i = 0;
  /** @type {import("./types.js").ParsedBox[]} */
  const returnedArray = [];

  while (i < arr.length) {
    const boxStartOffset = i;
    let currentOffset = i;
    if (arr.length - currentOffset < MIN_BOX_HEADER_SIZE) {
      returnedArray.push({
        alias: "",
        size: arr.length - currentOffset,
        values: [],
        errors: [
          {
            recoverable: false,
            message: `Cannot parse box header: missing ${
              MIN_BOX_HEADER_SIZE - (arr.length - currentOffset)
            } byte(s).`,
          },
        ],
      });
      break;
    }

    let size = be4toi(arr, currentOffset);
    currentOffset += 4;

    const name = betoa(arr, currentOffset, 4);
    currentOffset += 4;

    if (size === 1) {
      if (arr.length - currentOffset < LARGE_BOX_SIZE_BYTES) {
        returnedArray.push({
          alias: name,
          size: arr.length - boxStartOffset,
          values: [],
          errors: [
            {
              recoverable: false,
              message: `Cannot parse large box header: missing ${
                LARGE_BOX_SIZE_BYTES - (arr.length - currentOffset)
              } byte(s).`,
            },
          ],
        });
        break;
      }
      size = be8toi(arr, currentOffset);
      currentOffset += LARGE_BOX_SIZE_BYTES;
    } else if (size === 0) {
      size = arr.length - boxStartOffset;
    }

    /** @type {import("./types.js").ParsedBox} */
    const atomObject = {
      alias: name,
      size,
      values: [],
    };

    if (size < currentOffset - boxStartOffset) {
      addBoxError(
        atomObject,
        false,
        `Invalid box size ${size}: smaller than its ${
          currentOffset - boxStartOffset
        } byte header.`,
      );
      returnedArray.push(atomObject);
      break;
    }

    if (size > arr.length - boxStartOffset) {
      addBoxError(
        atomObject,
        false,
        `Truncated box: declared ${size} byte(s), only ${
          arr.length - boxStartOffset
        } available.`,
      );
    }

    if (name === "uuid") {
      const subtype = [];
      let j = UUID_SUBTYPE_BYTES;
      while (j-- && currentOffset < arr.length) {
        subtype.push(arr[currentOffset]);
        currentOffset += 1;
      }

      atomObject.subtype = subtype;
    }

    returnedArray.push(atomObject);

    parseBoxContent(
      atomObject,
      shouldReadContent(name)
        ? arr.slice(currentOffset, size + boxStartOffset)
        : new Uint8Array(0),
    );
    i += size;
  }

  return returnedArray;
}

class ProgressiveByteReader {
  /**
   * @param {AsyncIterator<Uint8Array>} iterator
   */
  constructor(iterator) {
    this._iterator = iterator;
    /** @type {Uint8Array[]} */
    this._buffers = [];
    this._bufferedLength = 0;
    this._done = false;
  }

  /**
   * @param {number} nbBytes
   * @returns {Promise<void>}
   */
  async ensure(nbBytes) {
    while (!this._done && this._bufferedLength < nbBytes) {
      const next = await this._iterator.next();
      if (next.done) {
        this._done = true;
        break;
      }

      if (next.value.length > 0) {
        this._buffers.push(next.value);
        this._bufferedLength += next.value.length;
      }
    }
  }

  /**
   * @returns {number}
   */
  getBufferedLength() {
    return this._bufferedLength;
  }

  /**
   * @returns {boolean}
   */
  isDone() {
    return this._done && this._bufferedLength === 0;
  }

  /**
   * @param {number} nbBytes
   * @returns {Uint8Array}
   */
  takeAvailable(nbBytes) {
    const size = Math.min(nbBytes, this._bufferedLength);
    const result = new Uint8Array(size);
    let resultOffset = 0;

    while (resultOffset < size) {
      const buffer = this._buffers[0];
      const copiedLength = Math.min(buffer.length, size - resultOffset);
      result.set(buffer.subarray(0, copiedLength), resultOffset);
      resultOffset += copiedLength;

      if (copiedLength === buffer.length) {
        this._buffers.shift();
      } else {
        this._buffers[0] = buffer.subarray(copiedLength);
      }
      this._bufferedLength -= copiedLength;
    }

    return result;
  }

  /**
   * @param {number} nbBytes
   * @returns {Promise<Uint8Array>}
   */
  async read(nbBytes) {
    await this.ensure(nbBytes);
    return this.takeAvailable(nbBytes);
  }

  /**
   * @param {number} nbBytes
   * @returns {Promise<number>}
   */
  async skip(nbBytes) {
    let remaining = nbBytes;
    let skipped = 0;

    while (remaining > 0) {
      await this.ensure(1);
      if (this._bufferedLength === 0) {
        break;
      }

      const skippedThisRound = Math.min(remaining, this._bufferedLength);
      this.takeAvailable(skippedThisRound);
      remaining -= skippedThisRound;
      skipped += skippedThisRound;
    }

    return skipped;
  }

  /**
   * @returns {Promise<number>}
   */
  async skipUntilEnd() {
    let skipped = 0;

    while (true) {
      await this.ensure(1);
      if (this._bufferedLength === 0) {
        break;
      }
      const skippedThisRound = this._bufferedLength;
      this.takeAvailable(skippedThisRound);
      skipped += skippedThisRound;
    }

    return skipped;
  }

  /**
   * @returns {Promise<Uint8Array>}
   */
  async readUntilEnd() {
    /** @type {Uint8Array[]} */
    const chunks = [];
    let totalLength = 0;

    while (true) {
      await this.ensure(1);
      if (this._bufferedLength === 0) {
        break;
      }
      const chunk = this.takeAvailable(this._bufferedLength);
      chunks.push(chunk);
      totalLength += chunk.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }
}

/**
 * @param {unknown} input
 * @returns {AsyncIterable<Uint8Array> | undefined}
 */
function getProgressiveSource(input) {
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
    typeof ReadableStream !== "undefined" &&
    input instanceof ReadableStream
  ) {
    return {
      async *[Symbol.asyncIterator]() {
        const reader = input.getReader();
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

/**
 * @param {unknown} chunk
 * @returns {Uint8Array}
 */
function byteChunkToUint8Array(chunk) {
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
function asyncByteIterable(iterable) {
  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of iterable) {
        yield byteChunkToUint8Array(chunk);
      }
    },
  };
}

/**
 * Parse ISOBMFF data from any progressive byte source.
 * @param {AsyncIterable<import("./types.js").ISOBMFFByteChunk> | Iterable<import("./types.js").ISOBMFFByteChunk>} source
 * @returns {Promise<import("./types.js").ParsedBox[]>}
 */
export async function parseBoxesProgressively(source) {
  const iterator = asyncByteIterable(source)[Symbol.asyncIterator]();
  const reader = new ProgressiveByteReader(iterator);
  /** @type {import("./types.js").ParsedBox[]} */
  const returnedArray = [];

  while (true) {
    const header = await reader.read(MIN_BOX_HEADER_SIZE);
    if (header.length === 0) {
      break;
    }

    if (header.length < MIN_BOX_HEADER_SIZE) {
      returnedArray.push({
        alias: "",
        size: header.length,
        values: [],
        errors: [
          {
            recoverable: false,
            message: `Cannot parse box header: missing ${
              MIN_BOX_HEADER_SIZE - header.length
            } byte(s).`,
          },
        ],
      });
      break;
    }

    let size = be4toi(header, 0);
    const name = betoa(header, 4, 4);
    let headerSize = MIN_BOX_HEADER_SIZE;

    if (size === 1) {
      const largeSizeBuffer = await reader.read(LARGE_BOX_SIZE_BYTES);
      headerSize += largeSizeBuffer.length;
      if (largeSizeBuffer.length < LARGE_BOX_SIZE_BYTES) {
        returnedArray.push({
          alias: name,
          size: header.length + largeSizeBuffer.length,
          values: [],
          errors: [
            {
              recoverable: false,
              message: `Cannot parse large box header: missing ${
                LARGE_BOX_SIZE_BYTES - largeSizeBuffer.length
              } byte(s).`,
            },
          ],
        });
        break;
      }
      size = be8toi(largeSizeBuffer, 0);
    }

    /** @type {number[] | undefined} */
    let subtype;
    if (name === "uuid") {
      const subtypeBuffer = await reader.read(UUID_SUBTYPE_BYTES);
      headerSize += subtypeBuffer.length;
      subtype = Array.from(subtypeBuffer);
    }

    /** @type {import("./types.js").ParsedBox} */
    const atomObject = {
      alias: name,
      size,
      values: [],
    };
    if (subtype !== undefined) {
      atomObject.subtype = subtype;
    }
    returnedArray.push(atomObject);

    if (size !== 0 && size < headerSize) {
      addBoxError(
        atomObject,
        false,
        `Invalid box size ${size}: smaller than its ${headerSize} byte header.`,
      );
      break;
    }

    if (size === 0) {
      if (shouldReadContent(name)) {
        const content = await reader.readUntilEnd();
        atomObject.size = headerSize + content.length;
        parseBoxContent(atomObject, content);
      } else {
        const skippedContentSize = await reader.skipUntilEnd();
        atomObject.size = headerSize + skippedContentSize;
        parseBoxContent(atomObject, new Uint8Array(0));
      }
      break;
    }

    const contentSize = size - headerSize;
    if (shouldReadContent(name)) {
      const content = await reader.read(contentSize);
      if (content.length < contentSize) {
        addBoxError(
          atomObject,
          false,
          `Truncated box: declared ${size} byte(s), only ${
            headerSize + content.length
          } available.`,
        );
      }
      parseBoxContent(atomObject, content);
      if (content.length < contentSize) {
        break;
      }
    } else {
      const skippedContentSize = await reader.skip(contentSize);
      if (skippedContentSize < contentSize) {
        addBoxError(
          atomObject,
          false,
          `Truncated box: declared ${size} byte(s), only ${
            headerSize + skippedContentSize
          } available.`,
        );
        break;
      }
      parseBoxContent(atomObject, new Uint8Array(0));
    }
  }

  return returnedArray;
}

/**
 * @overload
 * @param {import("./types.js").ISOBMFFByteChunk} arr
 * @returns {import("./types.js").ParsedBox[]}
 */

/**
 * @overload
 * @param {import("./types.js").ISOBMFFProgressiveInput} arr
 * @returns {Promise<import("./types.js").ParsedBox[]>}
 */

/**
 * Parse ISOBMFF data and translate it into a more useful array containing
 * "atom objects". Buffer inputs are parsed synchronously. Progressive inputs
 * are parsed progressively and return a Promise.
 * @param {import("./types.js").ISOBMFFInput} arr
 * @returns {import("./types.js").ParsedBox[] | Promise<import("./types.js").ParsedBox[]>}
 */
export default function parseBoxes(arr) {
  if (isBufferSource(arr)) {
    return recursiveParseBoxes(bufferSourceToUint8Array(arr));
  }

  const progressiveSource = getProgressiveSource(arr);
  if (progressiveSource !== undefined) {
    return parseBoxesProgressively(progressiveSource);
  }

  throw new Error(
    "Unrecognized format. " +
      "Please give an ArrayBuffer, TypedArray, Blob, ReadableStream, " +
      "Request, Response or byte iterable instead.",
  );
}
