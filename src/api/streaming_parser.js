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
 * @typedef {object} PayloadForwarding
 * @property {Set<string>} include
 * @property {import("../types.js").BoxPayloadChunkCallback} onChunk
 */

/**
 * @typedef {object} StreamingParserContext
 * @property {ProgressiveByteReader} reader
 * @property {(content: Uint8Array, offset: number, parentType?: string) => import("../types.js").ParsedBox[]} parseBuffer
 * @property {PayloadForwarding | undefined} payloadForwarding
 */

/**
 * @typedef {object} BoxParsingState
 * @property {number | undefined} remainingLength
 * @property {string[]} parentPath
 * @property {((box: import("../types.js").ParsedBox) => void) | undefined} onParsedBox
 * @property {number} baseOffset
 * @property {string | undefined} parentType
 */

/**
 * @param {import("../types.js").ParseEventsOptions | undefined} options
 * @returns {PayloadForwarding | undefined}
 */
function normalizePayloadForwarding(options) {
  const payloads = options?.payloads;
  if (
    payloads === undefined ||
    !Array.isArray(payloads.include) ||
    payloads.include.length === 0 ||
    typeof payloads.onChunk !== "function"
  ) {
    return undefined;
  }

  return {
    include: new Set(payloads.include),
    onChunk: payloads.onChunk,
  };
}

/**
 * @param {import("../types.js").ParsedBox} box
 * @param {string[]} path
 * @param {number} payloadOffset
 * @returns {import("../types.js").BoxPayloadChunkInfo}
 */
function createPayloadChunkInfo(box, path, payloadOffset) {
  return {
    path,
    type: box.type,
    boxOffset: box.offset,
    boxSize: box.size,
    headerSize: box.headerSize,
    sizeField: box.sizeField,
    uuid: box.uuid,
    payloadOffset,
    payloadAbsoluteOffset: box.offset + box.headerSize + payloadOffset,
  };
}

/**
 * @param {PayloadForwarding | undefined} payloadForwarding
 * @param {import("../types.js").ParsedBox} box
 * @returns {boolean}
 */
function shouldForwardPayload(payloadForwarding, box) {
  return payloadForwarding?.include.has(box.type) ?? false;
}

/**
 * @param {PayloadForwarding | undefined} payloadForwarding
 * @param {import("../types.js").ParsedBox} box
 * @param {string[]} path
 * @param {Uint8Array} chunk
 * @param {number} payloadOffset
 * @returns {Promise<void>}
 */
async function forwardPayloadChunk(
  payloadForwarding,
  box,
  path,
  chunk,
  payloadOffset,
) {
  if (
    payloadForwarding === undefined ||
    !shouldForwardPayload(payloadForwarding, box) ||
    chunk.length === 0
  ) {
    return;
  }

  await payloadForwarding.onChunk(
    createPayloadChunkInfo(box, path, payloadOffset),
    chunk,
  );
}

/**
 * @param {PayloadForwarding | undefined} payloadForwarding
 * @param {import("../types.js").ParsedBox} box
 * @param {string[]} path
 * @returns {((chunk: Uint8Array) => Promise<void>) | undefined}
 */
function createPayloadChunkForwarder(payloadForwarding, box, path) {
  if (!shouldForwardPayload(payloadForwarding, box)) {
    return undefined;
  }

  let payloadOffset = 0;
  return async (chunk) => {
    await forwardPayloadChunk(payloadForwarding, box, path, chunk, payloadOffset);
    payloadOffset += chunk.length;
  };
}

/**
 * @param {import("../types.js").ParsedBox[]} boxes
 * @param {string[]} parentPath
 * @param {PayloadForwarding | undefined} payloadForwarding
 * @param {Uint8Array=} sourceBytes
 * @returns {AsyncGenerator<import("../types.js").ParsedBoxParseEvent, void, void>}
 */
async function* emitParsedBoxEvents(
  boxes,
  parentPath,
  payloadForwarding,
  sourceBytes,
) {
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
    if (sourceBytes !== undefined && shouldForwardPayload(payloadForwarding, box)) {
      const payloadStart = box.offset + box.headerSize;
      const payloadEnd = box.offset + box.actualSize;
      const chunk = sourceBytes.subarray(payloadStart, payloadEnd);
      await forwardPayloadChunk(payloadForwarding, box, path, chunk, 0);
    }
    if (box.children) {
      yield* emitParsedBoxEvents(box.children, path, payloadForwarding, sourceBytes);
      yield { event: "box-complete", path, box };
    } else {
      yield { event: "box-complete", path, box };
    }
  }
}

/**
 * @param {StreamingParserContext} context
 * @param {BoxParsingState} state
 * @returns {AsyncGenerator<import("../types.js").ParsedBoxParseEvent, number, void>}
 */
async function* parseBoxEventsFromReader(context, state) {
  const { reader, parseBuffer, payloadForwarding } = context;
  const {
    remainingLength,
    parentPath,
    onParsedBox,
    baseOffset,
    parentType,
  } = state;
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
        actualSize: header.length,
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
          actualSize: header.length + largeSizeBuffer.length,
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
      actualSize: size === 0 ? headerSize : size,
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
        box.actualSize = headerSize + contentSize;
      }
    } else {
      contentSize = size - headerSize;
    }

    if (
      isContainerBox(name, parentType) &&
      !hasContentParser(name, parentType)
    ) {
      /** @type {import("../types.js").ParsedBox[]} */
      const children = [];
      const childConsumedLength = yield* parseBoxEventsFromReader(context, {
        remainingLength: contentSize,
        parentPath: path,
        onParsedBox: (child) => {
          children.push(child);
        },
        baseOffset: boxOffset + headerSize,
        parentType: name,
      });
      consumedLength += childConsumedLength;
      if (contentSize === undefined) {
        box.actualSize = headerSize + childConsumedLength;
      } else if (childConsumedLength < contentSize) {
        box.actualSize = headerSize + childConsumedLength;
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
        parentType,
      );
      yield { event: "box-complete", path, box };
      onParsedBox?.(box);
      if (contentSize !== undefined && childConsumedLength < contentSize) {
        break;
      }
      continue;
    }

    if (shouldReadContent(name, parentType)) {
      const onPayloadChunk = createPayloadChunkForwarder(
        payloadForwarding,
        box,
        path,
      );
      const content =
        contentSize === undefined
          ? onPayloadChunk === undefined
            ? await reader.readUntilEnd()
            : await reader.readUntilEndWithCallback(onPayloadChunk)
          : onPayloadChunk === undefined
            ? await reader.read(contentSize)
            : await reader.readWithCallback(contentSize, onPayloadChunk);
      consumedLength += content.length;
      if (contentSize === undefined) {
        box.actualSize = headerSize + content.length;
      } else if (content.length < contentSize) {
        box.actualSize = headerSize + content.length;
        addBoxIssue(
          box,
          "error",
          `Truncated box: declared ${box.size} byte(s), only ${
            headerSize + content.length
          } available.`,
        );
      }

      parseBoxContent(
        box,
        content,
        parseBuffer,
        boxOffset + headerSize,
        parentType,
      );
      if (box.children) {
        yield* emitParsedBoxEvents(box.children, path, payloadForwarding);
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

    const onPayloadChunk = createPayloadChunkForwarder(
      payloadForwarding,
      box,
      path,
    );
    const skippedContentSize =
      contentSize === undefined
        ? onPayloadChunk === undefined
          ? await reader.skipUntilEnd()
          : await reader.skipUntilEndWithCallback(onPayloadChunk)
        : onPayloadChunk === undefined
          ? await reader.skip(contentSize)
          : await reader.skipWithCallback(contentSize, onPayloadChunk);
    consumedLength += skippedContentSize;
    if (contentSize === undefined) {
      box.actualSize = headerSize + skippedContentSize;
    } else if (skippedContentSize < contentSize) {
      box.actualSize = headerSize + skippedContentSize;
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
      parentType,
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
 * @param {(content: Uint8Array, offset: number, parentType?: string) => import("../types.js").ParsedBox[]} parseBuffer
 * @param {import("../types.js").ParseEventsOptions=} options
 * @returns {AsyncGenerator<import("../types.js").ParsedBoxParseEvent, void, void>}
 */
export default async function* parseBoxEvents(input, parseBuffer, options) {
  const payloadForwarding = normalizePayloadForwarding(options);

  if (isBufferSource(input)) {
    const sourceBytes = bufferSourceToUint8Array(input);
    yield* emitParsedBoxEvents(
      parseBuffer(sourceBytes, 0, undefined),
      [],
      payloadForwarding,
      sourceBytes,
    );
    return;
  }

  const progressiveSource = getProgressiveSource(input);
  if (progressiveSource !== undefined) {
    const iterator =
      asyncByteIterable(progressiveSource)[Symbol.asyncIterator]();
    yield* parseBoxEventsFromReader(
      {
        reader: new ProgressiveByteReader(iterator),
        parseBuffer,
        payloadForwarding,
      },
      {
        remainingLength: undefined,
        parentPath: [],
        onParsedBox: undefined,
        baseOffset: 0,
        parentType: undefined,
      },
    );
    return;
  }

  throw new Error(
    "Unrecognized format. " +
      "Please give an ArrayBuffer, TypedArray, Blob, ReadableStream, " +
      "Request, Response or byte iterable instead.",
  );
}
