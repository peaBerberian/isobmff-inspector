/**
 * @typedef {object} BufferReader
 * @property {(nbBytes: number) => number} bytesToInt
 * @property {(nbBytes: number) => string} bytesToHex
 * @property {() => bigint} bytesToUint64BigInt
 * @property {() => bigint} bytesToInt64BigInt
 * @property {(nbBytes: number) => string} bytesToASCII
 * @property {() => number} getTotalLength
 * @property {() => number} getRemainingLength
 * @property {() => boolean} isFinished
 */

/**
 * @typedef {object} BoxContentEntry
 * @property {string} key
 * @property {string=} name
 * @property {string=} description
 */

/**
 * @typedef {{ [key: string]: unknown, __data__?: unknown }} BoxParserFields
 */

/**
 * @typedef {object} BoxDefinition
 * @property {string=} name
 * @property {string=} description
 * @property {BoxContentEntry[]=} content
 * @property {boolean=} container
 * @property {(reader: BufferReader) => unknown=} parser
 */

/**
 * @typedef {Record<string, BoxDefinition>} BoxDefinitionsMap
 */

/**
 * @typedef {object} ParsedBoxValue
 * @property {unknown} value
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {object} ParsedBox
 * @property {string} alias
 * @property {number} size
 * @property {ParsedBoxValue[]} values
 * @property {number[]=} subtype
 * @property {string=} name
 * @property {string=} description
 * @property {ParsedBox[]=} children
 */

export {};
