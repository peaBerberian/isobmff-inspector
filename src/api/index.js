import {
  asyncByteIterable,
  be4toi,
  be8toi,
  bufferSourceToUint8Array,
  bytesToHex,
  getProgressiveSource,
  isBufferSource,
  parseBoxType,
} from "../utils/bytes.js";
import ProgressiveByteReader from "../utils/ProgressiveByteReader.js";
import {
  addBoxIssue,
  parseBoxContent,
  shouldReadContent,
} from "./box_parsing.js";
import { formatParsedBoxes } from "./simple_format.js";
import parseBoxEventsFromInput from "./streaming_parser.js";

const MIN_BOX_HEADER_SIZE = 8;
const LARGE_BOX_SIZE_BYTES = 8;
const UUID_SUBTYPE_BYTES = 16;

/**
 * Parse recursively ISOBMFF Uint8Array.
 * @param {Uint8Array} arr
 * @param {number} baseOffset
 * @param {string=} parentType
 * @returns {import("../types.js").ParsedBox[]}
 */
function recursiveParseBoxes(arr, baseOffset = 0, parentType) {
  let i = 0;
  /** @type {import("../types.js").ParsedBox[]} */
  const returnedArray = [];

  while (i < arr.length) {
    const boxStartOffset = i;
    let currentOffset = i;
    if (arr.length - currentOffset < MIN_BOX_HEADER_SIZE) {
      returnedArray.push({
        type: "",
        offset: baseOffset + currentOffset,
        size: arr.length - currentOffset,
        headerSize: arr.length - currentOffset,
        values: [],
        issues: [
          {
            severity: "error",
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

    const name = parseBoxType(arr, currentOffset);
    currentOffset += 4;
    /** @type {"size" | "largeSize" | "extendsToEnd"} */
    let sizeField = "size";

    if (size === 1) {
      sizeField = "largeSize";
      if (arr.length - currentOffset < LARGE_BOX_SIZE_BYTES) {
        returnedArray.push({
          type: name,
          offset: baseOffset + boxStartOffset,
          size: arr.length - boxStartOffset,
          headerSize: arr.length - boxStartOffset,
          sizeField,
          values: [],
          issues: [
            {
              severity: "error",
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
      sizeField = "extendsToEnd";
      size = arr.length - boxStartOffset;
    }

    /** @type {import("../types.js").ParsedBox} */
    const atomObject = {
      type: name,
      offset: baseOffset + boxStartOffset,
      size,
      headerSize: currentOffset - boxStartOffset,
      sizeField,
      values: [],
      issues: [],
    };

    if (size < currentOffset - boxStartOffset) {
      addBoxIssue(
        atomObject,
        "error",
        `Invalid box size ${size}: smaller than its ${
          currentOffset - boxStartOffset
        } byte header.`,
      );
      returnedArray.push(atomObject);
      break;
    }

    if (size > arr.length - boxStartOffset) {
      addBoxIssue(
        atomObject,
        "error",
        `Truncated box: declared ${size} byte(s), only ${
          arr.length - boxStartOffset
        } available.`,
      );
    }

    if (name === "uuid") {
      const uuid = arr.slice(currentOffset, currentOffset + UUID_SUBTYPE_BYTES);
      atomObject.uuid = bytesToHex(uuid, 0, uuid.length);
      currentOffset += uuid.length;
      atomObject.headerSize = currentOffset - boxStartOffset;
    }

    returnedArray.push(atomObject);

    parseBoxContent(
      atomObject,
      shouldReadContent(name, parentType)
        ? arr.slice(currentOffset, size + boxStartOffset)
        : new Uint8Array(0),
      recursiveParseBoxes,
      baseOffset + currentOffset,
      parentType,
    );
    i += size;
  }

  return returnedArray;
}

/**
 * Progressively parse ISOBMFF data and yield metadata events as boxes are found.
 * @param {import("../types.js").ISOBMFFInput} input
 * @returns {AsyncGenerator<import("../types.js").ParsedBoxParseEvent, void, void>}
 */
export async function* parseEvents(input) {
  yield* parseBoxEventsFromInput(input, recursiveParseBoxes);
}

/**
 * Parse ISOBMFF data from any progressive byte source.
 * @param {AsyncIterable<import("../types.js").ISOBMFFByteChunk> | Iterable<import("../types.js").ISOBMFFByteChunk>} source
 * @returns {Promise<import("../types.js").ParsedBox[]>}
 */
async function parseProgressive(source) {
  const iterator = asyncByteIterable(source)[Symbol.asyncIterator]();
  const reader = new ProgressiveByteReader(iterator);
  /** @type {import("../types.js").ParsedBox[]} */
  const returnedArray = [];
  let offset = 0;

  while (true) {
    const boxOffset = offset;
    const header = await reader.read(MIN_BOX_HEADER_SIZE);
    offset += header.length;
    if (header.length === 0) {
      break;
    }

    if (header.length < MIN_BOX_HEADER_SIZE) {
      returnedArray.push({
        type: "",
        offset: boxOffset,
        size: header.length,
        headerSize: header.length,
        values: [],
        issues: [
          {
            severity: "error",
            message: `Cannot parse box header: missing ${
              MIN_BOX_HEADER_SIZE - header.length
            } byte(s).`,
          },
        ],
      });
      break;
    }

    let size = be4toi(header, 0);
    // TODO: Should we throw if not valid fourCC?
    const name = parseBoxType(header, 4);
    let headerSize = MIN_BOX_HEADER_SIZE;
    /** @type {"size" | "largeSize" | "extendsToEnd"} */
    let sizeField = "size";

    if (size === 1) {
      sizeField = "largeSize";
      const largeSizeBuffer = await reader.read(LARGE_BOX_SIZE_BYTES);
      offset += largeSizeBuffer.length;
      headerSize += largeSizeBuffer.length;
      if (largeSizeBuffer.length < LARGE_BOX_SIZE_BYTES) {
        returnedArray.push({
          type: name,
          offset: boxOffset,
          size: header.length + largeSizeBuffer.length,
          headerSize,
          sizeField,
          values: [],
          issues: [
            {
              severity: "error",
              message: `Cannot parse large box header: missing ${
                LARGE_BOX_SIZE_BYTES - largeSizeBuffer.length
              } byte(s).`,
            },
          ],
        });
        break;
      }
      size = be8toi(largeSizeBuffer, 0);
    } else if (size === 0) {
      sizeField = "extendsToEnd";
    }

    /** @type {string | undefined} */
    let uuid;
    if (name === "uuid") {
      const uuidBuffer = await reader.read(UUID_SUBTYPE_BYTES);
      offset += uuidBuffer.length;
      headerSize += uuidBuffer.length;
      uuid = bytesToHex(uuidBuffer, 0, uuidBuffer.length);
    }

    /** @type {import("../types.js").ParsedBox} */
    const atomObject = {
      type: name,
      offset: boxOffset,
      size,
      headerSize,
      sizeField,
      values: [],
      issues: [],
    };
    if (uuid !== undefined) {
      atomObject.uuid = uuid;
    }
    returnedArray.push(atomObject);

    if (size !== 0 && size < headerSize) {
      addBoxIssue(
        atomObject,
        "error",
        `Invalid box size ${size}: smaller than its ${headerSize} byte header.`,
      );
      break;
    }

    if (size === 0) {
      if (shouldReadContent(name)) {
        const content = await reader.readUntilEnd();
        offset += content.length;
        atomObject.size = headerSize + content.length;
        parseBoxContent(
          atomObject,
          content,
          recursiveParseBoxes,
          boxOffset + headerSize,
        );
      } else {
        const skippedContentSize = await reader.skipUntilEnd();
        offset += skippedContentSize;
        atomObject.size = headerSize + skippedContentSize;
        parseBoxContent(
          atomObject,
          new Uint8Array(0),
          recursiveParseBoxes,
          boxOffset + headerSize,
        );
      }
      break;
    }

    const contentSize = size - headerSize;
    if (shouldReadContent(name)) {
      const content = await reader.read(contentSize);
      offset += content.length;
      if (content.length < contentSize) {
        addBoxIssue(
          atomObject,
          "error",
          `Truncated box: declared ${size} byte(s), only ${
            headerSize + content.length
          } available.`,
        );
      }
      parseBoxContent(
        atomObject,
        content,
        recursiveParseBoxes,
        boxOffset + headerSize,
      );
      if (content.length < contentSize) {
        break;
      }
    } else {
      const skippedContentSize = await reader.skip(contentSize);
      offset += skippedContentSize;
      if (skippedContentSize < contentSize) {
        addBoxIssue(
          atomObject,
          "error",
          `Truncated box: declared ${size} byte(s), only ${
            headerSize + skippedContentSize
          } available.`,
        );
        break;
      }
      parseBoxContent(
        atomObject,
        new Uint8Array(0),
        recursiveParseBoxes,
        boxOffset + headerSize,
      );
    }
  }

  return returnedArray;
}

/**
 * @param {import("../types.js").ParseOptions=} options
 * @returns {"full" | "simple"}
 */
function getParseFormat(options) {
  const format = options?.format ?? "full";
  if (format === "full" || format === "simple") {
    return format;
  }
  throw new Error(`Unsupported parse format: ${format}`);
}

/**
 * @template {import("../types.js").ParsedBox[] | import("../types.js").SimpleParsedBox[]} T
 * @param {import("../types.js").ParsedBox[]} boxes
 * @param {"full" | "simple"} format
 * @returns {T}
 */
function formatParseResult(boxes, format) {
  if (format === "full") {
    return /** @type {T} */ (boxes);
  }
  return /** @type {T} */ (formatParsedBoxes(boxes));
}

/**
 * @overload
 * @param {import("../types.js").ISOBMFFInput} arr
 * @returns {Promise<import("../types.js").ParsedBox[]>}
 */
/**
 * @overload
 * @param {import("../types.js").ISOBMFFInput} arr
 * @param {{ format?: "full" }} options
 * @returns {Promise<import("../types.js").ParsedBox[]>}
 */
/**
 * @overload
 * @param {import("../types.js").ISOBMFFInput} arr
 * @param {{ format: "simple" }} options
 * @returns {Promise<import("../types.js").SimpleParsedBox[]>}
 */
/**
 * Parse ISOBMFF data and translate it into a more useful array containing
 * parsed box objects.
 * @param {import("../types.js").ISOBMFFInput} arr
 * @param {import("../types.js").ParseOptions=} options
 * @returns {Promise<import("../types.js").ParsedBox[] | import("../types.js").SimpleParsedBox[]>}
 */
export async function parse(arr, options) {
  const format = getParseFormat(options);
  /** @type {import("../types.js").ParsedBox[]} */
  let boxes;
  if (isBufferSource(arr)) {
    boxes = recursiveParseBoxes(bufferSourceToUint8Array(arr));
  } else {
    const progressiveSource = getProgressiveSource(arr);
    if (progressiveSource === undefined) {
      throw new Error(
        "Unrecognized format. " +
          "Please give an ArrayBuffer, TypedArray, Blob, ReadableStream, " +
          "Request, Response or byte iterable instead.",
      );
    }
    boxes = await parseProgressive(progressiveSource);
  }

  return formatParseResult(boxes, format);
}

/**
 * @overload
 * @param {import("../types.js").ISOBMFFByteChunk} arr
 * @returns {import("../types.js").ParsedBox[]}
 */
/**
 * @overload
 * @param {import("../types.js").ISOBMFFByteChunk} arr
 * @param {{ format?: "full" }} options
 * @returns {import("../types.js").ParsedBox[]}
 */
/**
 * @overload
 * @param {import("../types.js").ISOBMFFByteChunk} arr
 * @param {{ format: "simple" }} options
 * @returns {import("../types.js").SimpleParsedBox[]}
 */
/**
 * Synchronously parse ISOBMFF data from a buffer input.
 * @param {import("../types.js").ISOBMFFByteChunk} arr
 * @param {import("../types.js").ParseOptions=} options
 * @returns {import("../types.js").ParsedBox[] | import("../types.js").SimpleParsedBox[]}
 */
export function parseBuffer(arr, options) {
  const format = getParseFormat(options);
  return formatParseResult(
    recursiveParseBoxes(bufferSourceToUint8Array(arr)),
    format,
  );
}

export default parse;
