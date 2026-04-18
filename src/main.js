import definitions from "./boxes/index.js";
import BufferReader from "./utils/buffer_reader.js";
import { be4toi, be8toi, betoa } from "./utils/bytes.js";

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
 * Parse recursively ISOBMFF Uint8Array.
 * @param {Uint8Array} arr
 * @returns {import("./types.js").ParsedBox[]}
 */
function recursiveParseBoxes(arr) {
  let i = 0;
  /** @type {import("./types.js").ParsedBox[]} */
  const returnedArray = [];

  while (i < arr.length) {
    let currentOffset = i;
    if (arr.length - currentOffset < 8) {
      returnedArray.push({
        alias: "",
        size: arr.length - currentOffset,
        values: [],
        errors: [
          {
            recoverable: false,
            message: `Cannot parse box header: missing ${
              8 - (arr.length - currentOffset)
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
      if (arr.length - currentOffset < 8) {
        returnedArray.push({
          alias: name,
          size: arr.length - i,
          values: [],
          errors: [
            {
              recoverable: false,
              message: `Cannot parse large box header: missing ${
                8 - (arr.length - currentOffset)
              } byte(s).`,
            },
          ],
        });
        break;
      }
      size = be8toi(arr, currentOffset);
      currentOffset += 8;
    } else if (size === 0) {
      size = arr.length - i;
    }

    /** @type {import("./types.js").ParsedBox} */
    const atomObject = {
      alias: name,
      size,
      values: [],
    };

    if (size < currentOffset - i) {
      addBoxError(
        atomObject,
        false,
        `Invalid box size ${size}: smaller than its ${currentOffset - i} byte header.`,
      );
      returnedArray.push(atomObject);
      break;
    }

    if (size > arr.length - i) {
      addBoxError(
        atomObject,
        false,
        `Truncated box: declared ${size} byte(s), only ${arr.length - i} available.`,
      );
    }

    if (name === "uuid") {
      const subtype = [];
      let j = 16;
      while (j-- && currentOffset < arr.length) {
        subtype.push(arr[currentOffset]);
        currentOffset += 1;
      }

      atomObject.subtype = subtype;
    }

    returnedArray.push(atomObject);

    if (definitions[name]) {
      const config = definitions[name];
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

      const content = arr.slice(currentOffset, size + i);
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
        const childrenResult = parseBoxes(contentForChildren || content);
        atomObject.children = childrenResult;
      }
    }
    i += size;
  }

  return returnedArray;
}

/**
 * Parse ISOBMFF file and translate it into a more useful array containing
 * "atom objects".
 * @param {ArrayBuffer | ArrayBufferView} arr
 * @returns {import("./types.js").ParsedBox[]}
 */
export default function parseBoxes(arr) {
  if (arr instanceof Uint8Array) {
    return recursiveParseBoxes(arr);
  }
  if (arr instanceof ArrayBuffer) {
    return recursiveParseBoxes(new Uint8Array(arr));
  }
  if (ArrayBuffer.isView(arr)) {
    return recursiveParseBoxes(new Uint8Array(arr.buffer));
  }
  throw new Error(
    "Unrecognized format. " +
      "Please give an ArrayBuffer or TypedArray instead.",
  );
}
