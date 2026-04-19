import {
  addBoxError,
  parseBoxContent,
  shouldReadContent,
} from "./box_content_parser.js";
import parseBoxEventsFromInput from "./box_event_parser.js";
import ProgressiveByteReader from "./progressive_byte_reader.js";
import {
  asyncByteIterable,
  bufferSourceToUint8Array,
  getProgressiveSource,
  isBufferSource,
} from "./progressive_source.js";
import { be4toi, be8toi, betoa, bytesToHex } from "./utils/bytes.js";

const MIN_BOX_HEADER_SIZE = 8;
const LARGE_BOX_SIZE_BYTES = 8;
const UUID_SUBTYPE_BYTES = 16;

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
        type: "",
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
          type: name,
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
      type: name,
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
      const uuid = arr.slice(currentOffset, currentOffset + UUID_SUBTYPE_BYTES);
      atomObject.uuid = bytesToHex(uuid, 0, uuid.length);
      currentOffset += uuid.length;
    }

    returnedArray.push(atomObject);

    parseBoxContent(
      atomObject,
      shouldReadContent(name)
        ? arr.slice(currentOffset, size + boxStartOffset)
        : new Uint8Array(0),
      recursiveParseBoxes,
    );
    i += size;
  }

  return returnedArray;
}

/**
 * Progressively parse ISOBMFF data and yield metadata events as boxes are found.
 * @param {import("./types.js").ISOBMFFInput} input
 * @returns {AsyncGenerator<import("./types.js").ParsedBoxParseEvent, void, void>}
 */
export async function* parseBoxEvents(input) {
  yield* parseBoxEventsFromInput(input, recursiveParseBoxes);
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
        type: "",
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
          type: name,
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

    /** @type {string | undefined} */
    let uuid;
    if (name === "uuid") {
      const uuidBuffer = await reader.read(UUID_SUBTYPE_BYTES);
      headerSize += uuidBuffer.length;
      uuid = bytesToHex(uuidBuffer, 0, uuidBuffer.length);
    }

    /** @type {import("./types.js").ParsedBox} */
    const atomObject = {
      type: name,
      size,
      values: [],
    };
    if (uuid !== undefined) {
      atomObject.uuid = uuid;
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
        parseBoxContent(atomObject, content, recursiveParseBoxes);
      } else {
        const skippedContentSize = await reader.skipUntilEnd();
        atomObject.size = headerSize + skippedContentSize;
        parseBoxContent(atomObject, new Uint8Array(0), recursiveParseBoxes);
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
      parseBoxContent(atomObject, content, recursiveParseBoxes);
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
      parseBoxContent(atomObject, new Uint8Array(0), recursiveParseBoxes);
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
