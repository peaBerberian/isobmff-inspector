/**
 * @template {{ [k: string]: unknown }} T
 * @typedef {object} BoxDefinition
 * @property {string=} name
 * @property {string=} description
 * @property {boolean=} container
 * @property {(reader: import("../BoxReader.js").BoxReader<T>) => T | void=} parser
 */

// Force module detection
export {};
