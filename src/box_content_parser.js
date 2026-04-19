import definitions from "./boxes/index.js";
import BufferReader from "./utils/buffer_reader.js";

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
export function addBoxError(box, recoverable, message) {
  if (!box.errors) {
    box.errors = [];
  }
  box.errors.push({ recoverable, message });
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function shouldReadContent(name) {
  const config = definitions[name];
  return !!(config && (config.parser || config.container));
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function hasContentParser(name) {
  const config = definitions[name];
  return !!config?.parser;
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function isContainerBox(name) {
  const config = definitions[name];
  return !!config?.container;
}

/**
 * @param {import("./types.js").ParsedBox} atomObject
 * @param {Uint8Array} content
 * @param {(content: Uint8Array) => import("./types.js").ParsedBox[]} parseChildren
 * @returns {void}
 */
export function parseBoxContent(atomObject, content, parseChildren) {
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
    atomObject.children = parseChildren(contentForChildren || content);
  }
}
