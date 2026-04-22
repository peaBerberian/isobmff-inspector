import BoxReader from "./box_reader.js";
import definitions from "./boxes/index.js";
import { parsedBoxValue } from "./fields.js";

/**
 * @param {unknown} error
 * @returns {string}
 */
function formatErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {import("./types.js").ParsedBox} box
 * @param {"warning" | "error"} severity
 * @param {string} message
 * @returns {void}
 */
export function addBoxIssue(box, severity, message) {
  box.issues.push({ severity, message });
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
 * @param {(content: Uint8Array, offset: number) => import("./types.js").ParsedBox[]} parseChildren
 * @param {number} contentOffset
 * @returns {void}
 */
export function parseBoxContent(
  atomObject,
  content,
  parseChildren,
  contentOffset,
) {
  const config = definitions[atomObject.type];
  if (!config) {
    return;
  }

  if (config.name) {
    atomObject.name = config.name;
  }
  if (config.description) {
    atomObject.description = config.description;
  }
  const hasChildren = !!config.container;
  /** @type {Uint8Array | undefined} */
  let contentForChildren;

  if (typeof config.parser === "function") {
    const parserReader = BoxReader(content);
    /** @type {import("./types.js").BoxParserFields | undefined} */
    let result;
    try {
      result = /** @type {import("./types.js").BoxParserFields | undefined} */ (
        config.parser(parserReader)
      );
    } catch (e) {
      addBoxIssue(atomObject, "error", formatErrorMessage(e));
    }

    atomObject.issues.push(...parserReader.getIssues());

    if (hasChildren) {
      const remaining = parserReader.getRemainingLength();
      contentForChildren = content.slice(content.length - remaining);
      contentOffset += content.length - remaining;
    } else if (!parserReader.isFinished()) {
      addBoxIssue(
        atomObject,
        "warning",
        `Parser left ${parserReader.getRemainingLength()} byte(s) unread.`,
      );
    }

    atomObject.values.push(...parserReader.getValues());

    try {
      if (result !== undefined) {
        delete result.__data__;
        Object.keys(result).forEach((key) => {
          atomObject.values.push(parsedBoxValue(key, result[key]));
        });
      }
    } catch (e) {
      addBoxIssue(atomObject, "error", formatErrorMessage(e));
    }
  }

  if (hasChildren) {
    atomObject.children = parseChildren(
      contentForChildren || content,
      contentOffset,
    );
  }
}
