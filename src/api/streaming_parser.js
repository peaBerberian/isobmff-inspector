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
  hasContentParser,
  isContainerBox,
  parseBoxContent,
  shouldReadContent,
} from "./box_parsing.js";

const MIN_BOX_HEADER_SIZE = 8;
const LARGE_BOX_SIZE_BYTES = 8;
const UUID_SUBTYPE_BYTES = 16;

/**
 * @param {import("../types.js").ParsedBox[]} boxes
 * @param {string[]} parentPath
 * @returns {AsyncGenerator<import("../types.js").ParsedBoxParseEvent, void, void>}
 */
async function* emitParsedBoxEvents(boxes, parentPath) {
  for (const box of boxes) {
    const path = parentPath.concat(box.type);
    yield {
      event: "box-start",
      path,
      type: box.type,
      offset: box.offset,
      size: box.size,
      headerSize: box.headerSize,
      sizeField: box.sizeField,
      uuid: box.uuid,
    };
    if (box.children) {
      yield* emitParsedBoxEvents(box.children, path);
      yield { event: "box-complete", path, box };
    } else {
      yield { event: "box-complete", path, box };
    }
  }
}

/**
 * @param {ProgressiveByteReader} reader
 * @param {(content: Uint8Array, offset: number) => import("../types.js").ParsedBox[]} parseBuffer
 * @param {number | undefined} remainingLength
 * @param {string[]} parentPath
 * @param {((box: import("../types.js").ParsedBox) => void)=} onParsedBox
 * @param {number=} baseOffset
 * @returns {AsyncGenerator<import("../types.js").ParsedBoxParseEvent, number, void>}
 */
async function* parseBoxEventsFromReader(
  reader,
  parseBuffer,
  remainingLength,
  parentPath,
  onParsedBox,
  baseOffset = 0,
) {
  let consumedLength = 0;

  while (remainingLength === undefined || consumedLength < remainingLength) {
    const boxOffset = baseOffset + consumedLength;
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
      /** @type {import("../types.js").ParsedBox} */
      const box = {
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
      };
      yield { event: "box-complete", path: parentPath.concat(""), box };
      onParsedBox?.(box);
      break;
    }

    let size = be4toi(header, 0);
    const name = parseBoxType(header, 4);
    const path = parentPath.concat(name);
    let headerSize = MIN_BOX_HEADER_SIZE;
    /** @type {"size" | "largeSize" | "extendsToEnd"} */
    let sizeField = "size";

    if (size === 1) {
      sizeField = "largeSize";
      const largeSizeLength =
        remainingLength === undefined
          ? LARGE_BOX_SIZE_BYTES
          : Math.min(LARGE_BOX_SIZE_BYTES, remainingLength - consumedLength);
      const largeSizeBuffer = await reader.read(largeSizeLength);
      consumedLength += largeSizeBuffer.length;
      headerSize += largeSizeBuffer.length;

      if (largeSizeBuffer.length < LARGE_BOX_SIZE_BYTES) {
        /** @type {import("../types.js").ParsedBox} */
        const box = {
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
        };
        yield { event: "box-complete", path, box };
        onParsedBox?.(box);
        break;
      }
      size = be8toi(largeSizeBuffer, 0);
    } else if (size === 0) {
      sizeField = "extendsToEnd";
    }

    /** @type {string | undefined} */
    let uuid;
    if (name === "uuid") {
      const uuidLength =
        remainingLength === undefined
          ? UUID_SUBTYPE_BYTES
          : Math.min(UUID_SUBTYPE_BYTES, remainingLength - consumedLength);
      const uuidBuffer = await reader.read(uuidLength);
      consumedLength += uuidBuffer.length;
      headerSize += uuidBuffer.length;
      uuid = bytesToHex(uuidBuffer, 0, uuidBuffer.length);
    }

    /** @type {import("../types.js").ParsedBox} */
    const box = {
      type: name,
      offset: boxOffset,
      size,
      headerSize,
      sizeField,
      values: [],
      issues: [],
    };
    if (uuid !== undefined) {
      box.uuid = uuid;
    }

    yield {
      event: "box-start",
      path,
      type: box.type,
      offset: box.offset,
      size: box.size,
      headerSize: box.headerSize,
      sizeField: box.sizeField,
      uuid: box.uuid,
    };

    if (size !== 0 && size < headerSize) {
      addBoxIssue(
        box,
        "error",
        `Invalid box size ${size}: smaller than its ${headerSize} byte header.`,
      );
      yield { event: "box-complete", path, box };
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
      /** @type {import("../types.js").ParsedBox[]} */
      const children = [];
      const childConsumedLength = yield* parseBoxEventsFromReader(
        reader,
        parseBuffer,
        contentSize,
        path,
        (child) => {
          children.push(child);
        },
        boxOffset + headerSize,
      );
      consumedLength += childConsumedLength;
      if (contentSize === undefined) {
        box.size = headerSize + childConsumedLength;
      } else if (childConsumedLength < contentSize) {
        addBoxIssue(
          box,
          "error",
          `Truncated box: declared ${box.size} byte(s), only ${
            headerSize + childConsumedLength
          } available.`,
        );
      }
      parseBoxContent(
        box,
        new Uint8Array(0),
        () => children,
        boxOffset + headerSize,
      );
      yield { event: "box-complete", path, box };
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
        addBoxIssue(
          box,
          "error",
          `Truncated box: declared ${box.size} byte(s), only ${
            headerSize + content.length
          } available.`,
        );
      }

      parseBoxContent(box, content, parseBuffer, boxOffset + headerSize);
      if (box.children) {
        yield* emitParsedBoxEvents(box.children, path);
        yield { event: "box-complete", path, box };
      } else {
        yield { event: "box-complete", path, box };
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
      addBoxIssue(
        box,
        "error",
        `Truncated box: declared ${box.size} byte(s), only ${
          headerSize + skippedContentSize
        } available.`,
      );
    }
    parseBoxContent(
      box,
      new Uint8Array(0),
      parseBuffer,
      boxOffset + headerSize,
    );
    yield { event: "box-complete", path, box };
    onParsedBox?.(box);

    if (contentSize !== undefined && skippedContentSize < contentSize) {
      break;
    }
  }

  return consumedLength;
}

/**
 * Progressively parse ISOBMFF data and yield metadata events as boxes are found.
 * @param {import("../types.js").ISOBMFFInput} input
 * @param {(content: Uint8Array, offset: number) => import("../types.js").ParsedBox[]} parseBuffer
 * @returns {AsyncGenerator<import("../types.js").ParsedBoxParseEvent, void, void>}
 */
export default async function* parseBoxEvents(input, parseBuffer) {
  if (isBufferSource(input)) {
    yield* emitParsedBoxEvents(
      parseBuffer(bufferSourceToUint8Array(input), 0),
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
      undefined,
      0,
    );
    return;
  }

  throw new Error(
    "Unrecognized format. " +
      "Please give an ArrayBuffer, TypedArray, Blob, ReadableStream, " +
      "Request, Response or byte iterable instead.",
  );
}
