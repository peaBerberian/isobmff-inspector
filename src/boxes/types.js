/**
 * @template {{ [k: string]: unknown }} T
 * @typedef {object} BoxDefinition
 * @property {string=} name
 * @property {string=} description
 * @property {boolean=} container
 * @property {(reader: import("../BoxReader.js").BoxReader<T>) => T | void=} parser
 * @property {(type: string) => BoxDefinition<{ [key: string]: unknown }> | undefined=} getChildDefinition
 */

// Force module detection
export {};
