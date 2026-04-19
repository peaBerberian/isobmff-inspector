import {
  addBoxError,
  hasContentParser,
  isContainerBox,
  parseBoxContent,
  shouldReadContent,
} from "./box_content_parser.js";
import ProgressiveByteReader from "./progressive_byte_reader.js";
import {
  asyncByteIterable,
  bufferSourceToUint8Array,
  getProgressiveSource,
  isBufferSource,
} from "./progressive_source.js";
import { be4toi, be8toi, betoa } from "./utils/bytes.js";

const MIN_BOX_HEADER_SIZE = 8;
const LARGE_BOX_SIZE_BYTES = 8;
const UUID_SUBTYPE_BYTES = 16;

/**
 * @param {import("./types.js").ParsedBox[]} boxes
 * @param {string[]} parentPath
 * @returns {AsyncGenerator<import("./types.js").ParsedBoxParseEvent, void, void>}
 */
async function* emitParsedBoxEvents(boxes, parentPath) {
  for (const box of boxes) {
    const path = parentPath.concat(box.alias);
    yield {
      type: "box-start",
      path,
      alias: box.alias,
      size: box.size,
      subtype: box.subtype,
    };
    if (box.children) {
      yield* emitParsedBoxEvents(box.children, path);
      yield { type: "box-end", path, box };
    } else {
      yield { type: "box", path, box };
    }
  }
}

/**
 * @param {ProgressiveByteReader} reader
 * @param {(content: Uint8Array) => import("./types.js").ParsedBox[]} parseBuffer
 * @param {number | undefined} remainingLength
 * @param {string[]} parentPath
 * @param {((box: import("./types.js").ParsedBox) => void)=} onParsedBox
 * @returns {AsyncGenerator<import("./types.js").ParsedBoxParseEvent, number, void>}
 */
async function* parseBoxEventsFromReader(
  reader,
  parseBuffer,
  remainingLength,
  parentPath,
  onParsedBox,
) {
  let consumedLength = 0;

  while (remainingLength === undefined || consumedLength < remainingLength) {
    const remainingInParent =
      remainingLength === undefined
        ? undefined
        : remainingLength - consumedLength;
    const headerLength =
      remainingInParent === undefined
        ? MIN_BOX_HEADER_SIZE
        : Math.min(MIN_BOX_HEADER_SIZE, remainingInParent);
    const header = await reader.read(headerLength);
    consumedLength += header.length;

    if (header.length === 0) {
      break;
    }

    if (header.length < MIN_BOX_HEADER_SIZE) {
      const box = {
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
      };
      yield { type: "box", path: parentPath.concat(""), box };
      onParsedBox?.(box);
      break;
    }

    let size = be4toi(header, 0);
    const name = betoa(header, 4, 4);
    const path = parentPath.concat(name);
    let headerSize = MIN_BOX_HEADER_SIZE;

    if (size === 1) {
      const largeSizeLength =
        remainingLength === undefined
          ? LARGE_BOX_SIZE_BYTES
          : Math.min(LARGE_BOX_SIZE_BYTES, remainingLength - consumedLength);
      const largeSizeBuffer = await reader.read(largeSizeLength);
      consumedLength += largeSizeBuffer.length;
      headerSize += largeSizeBuffer.length;

      if (largeSizeBuffer.length < LARGE_BOX_SIZE_BYTES) {
        const box = {
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
        };
        yield { type: "box", path, box };
        onParsedBox?.(box);
        break;
      }
      size = be8toi(largeSizeBuffer, 0);
    }

    /** @type {number[] | undefined} */
    let subtype;
    if (name === "uuid") {
      const subtypeLength =
        remainingLength === undefined
          ? UUID_SUBTYPE_BYTES
          : Math.min(UUID_SUBTYPE_BYTES, remainingLength - consumedLength);
      const subtypeBuffer = await reader.read(subtypeLength);
      consumedLength += subtypeBuffer.length;
      headerSize += subtypeBuffer.length;
      subtype = Array.from(subtypeBuffer);
    }

    /** @type {import("./types.js").ParsedBox} */
    const box = {
      alias: name,
      size,
      values: [],
    };
    if (subtype !== undefined) {
      box.subtype = subtype;
    }

    yield {
      type: "box-start",
      path,
      alias: box.alias,
      size: box.size,
      subtype: box.subtype,
    };

    if (size !== 0 && size < headerSize) {
      addBoxError(
        box,
        false,
        `Invalid box size ${size}: smaller than its ${headerSize} byte header.`,
      );
      yield { type: "box", path, box };
      onParsedBox?.(box);
      break;
    }

    /** @type {number | undefined} */
    let contentSize;
    if (size === 0) {
      contentSize =
        remainingLength === undefined
          ? undefined
          : remainingLength - consumedLength;
      if (contentSize !== undefined) {
        box.size = headerSize + contentSize;
      }
    } else {
      contentSize = size - headerSize;
    }

    if (isContainerBox(name) && !hasContentParser(name)) {
      /** @type {import("./types.js").ParsedBox[]} */
      const children = [];
      const childConsumedLength = yield* parseBoxEventsFromReader(
        reader,
        parseBuffer,
        contentSize,
        path,
        (child) => {
          children.push(child);
        },
      );
      consumedLength += childConsumedLength;
      if (contentSize === undefined) {
        box.size = headerSize + childConsumedLength;
      } else if (childConsumedLength < contentSize) {
        addBoxError(
          box,
          false,
          `Truncated box: declared ${box.size} byte(s), only ${
            headerSize + childConsumedLength
          } available.`,
        );
      }
      parseBoxContent(box, new Uint8Array(0), () => children);
      yield { type: "box-end", path, box };
      onParsedBox?.(box);
      if (contentSize !== undefined && childConsumedLength < contentSize) {
        break;
      }
      continue;
    }

    if (shouldReadContent(name)) {
      const content =
        contentSize === undefined
          ? await reader.readUntilEnd()
          : await reader.read(contentSize);
      consumedLength += content.length;
      if (contentSize === undefined) {
        box.size = headerSize + content.length;
      } else if (content.length < contentSize) {
        addBoxError(
          box,
          false,
          `Truncated box: declared ${box.size} byte(s), only ${
            headerSize + content.length
          } available.`,
        );
      }

      parseBoxContent(box, content, parseBuffer);
      if (box.children) {
        yield* emitParsedBoxEvents(box.children, path);
        yield { type: "box-end", path, box };
      } else {
        yield { type: "box", path, box };
      }
      onParsedBox?.(box);

      if (contentSize !== undefined && content.length < contentSize) {
        break;
      }
      continue;
    }

    const skippedContentSize =
      contentSize === undefined
        ? await reader.skipUntilEnd()
        : await reader.skip(contentSize);
    consumedLength += skippedContentSize;
    if (contentSize === undefined) {
      box.size = headerSize + skippedContentSize;
    } else if (skippedContentSize < contentSize) {
      addBoxError(
        box,
        false,
        `Truncated box: declared ${box.size} byte(s), only ${
          headerSize + skippedContentSize
        } available.`,
      );
    }
    parseBoxContent(box, new Uint8Array(0), parseBuffer);
    yield { type: "box", path, box };
    onParsedBox?.(box);

    if (contentSize !== undefined && skippedContentSize < contentSize) {
      break;
    }
  }

  return consumedLength;
}

/**
 * Progressively parse ISOBMFF data and yield metadata events as boxes are found.
 * @param {import("./types.js").ISOBMFFInput} input
 * @param {(content: Uint8Array) => import("./types.js").ParsedBox[]} parseBuffer
 * @returns {AsyncGenerator<import("./types.js").ParsedBoxParseEvent, void, void>}
 */
export default async function* parseBoxEvents(input, parseBuffer) {
  if (isBufferSource(input)) {
    yield* emitParsedBoxEvents(
      parseBuffer(bufferSourceToUint8Array(input)),
      [],
    );
    return;
  }

  const progressiveSource = getProgressiveSource(input);
  if (progressiveSource !== undefined) {
    const iterator =
      asyncByteIterable(progressiveSource)[Symbol.asyncIterator]();
    yield* parseBoxEventsFromReader(
      new ProgressiveByteReader(iterator),
      parseBuffer,
      undefined,
      [],
    );
    return;
  }

  throw new Error(
    "Unrecognized format. " +
      "Please give an ArrayBuffer, TypedArray, Blob, ReadableStream, " +
      "Request, Response or byte iterable instead.",
  );
}
