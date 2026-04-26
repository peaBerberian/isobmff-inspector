import BoxReader from "../BoxReader.js";
import definitions from "../boxes/index.js";

/**
 * @param {unknown} error
 * @returns {string}
 */
function formatErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {import("../types.js").ParsedBox} box
 * @param {"warning" | "error"} severity
 * @param {string} message
 * @returns {void}
 */
export function addBoxIssue(box, severity, message) {
  box.issues.push({ severity, message });
}

/**
 * @param {string} name
 * @param {string=} parentType
 * @returns {import("../boxes/types.js").BoxDefinition<{ [key: string]: unknown }> | undefined}
 */
export function getBoxDefinition(name, parentType) {
  const exactDefinition = definitions[name];
  if (exactDefinition !== undefined) {
    return exactDefinition;
  }

  return definitions[parentType ?? ""]?.getChildDefinition?.(name);
}

/**
 * @param {string} name
 * @param {string=} parentType
 * @returns {boolean}
 */
export function shouldReadContent(name, parentType) {
  const config = getBoxDefinition(name, parentType);
  return !!(config && (config.parser || config.container));
}

/**
 * @param {string} name
 * @param {string=} parentType
 * @returns {boolean}
 */
export function hasContentParser(name, parentType) {
  const config = getBoxDefinition(name, parentType);
  return !!config?.parser;
}

/**
 * @param {string} name
 * @param {string=} parentType
 * @returns {boolean}
 */
export function isContainerBox(name, parentType) {
  const config = getBoxDefinition(name, parentType);
  return !!config?.container;
}

/**
 * @param {import("../types.js").ParsedBox} atomObject
 * @param {Uint8Array} content
 * @param {(content: Uint8Array, offset: number, parentType?: string) => import("../types.js").ParsedBox[]} parseChildren
 * @param {number} contentOffset
 * @param {string=} parentType
 * @returns {void}
 */
export function parseBoxContent(
  atomObject,
  content,
  parseChildren,
  contentOffset,
  parentType,
) {
  const config = getBoxDefinition(atomObject.type, parentType);
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
    const parserReader = new BoxReader(content, contentOffset);
    /** @type {import("../types.js").BoxParserFields | undefined} */
    try {
      config.parser(parserReader);
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
  }

  if (hasChildren) {
    atomObject.children = parseChildren(
      contentForChildren || content,
      contentOffset,
      atomObject.type,
    );
  }
}
