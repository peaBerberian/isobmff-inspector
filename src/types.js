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
 * @template {{ [k: string]: unknown }} T
 * @typedef {object} BoxDefinition
 * @property {string=} name
 * @property {string=} description
 * @property {BoxContentEntry[]=} content
 * @property {boolean=} container
 * @property {(reader: BufferReader) => T=} parser
 */

/**
 * @typedef {Record<string, BoxDefinition<{ [k: string]: unknown }>>} BoxDefinitionsMap
 */

/**
 * @typedef {object} ParsedBoxValue
 * @property {any} value
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {object} ParsedBoxError
 * @property {boolean} recoverable
 * @property {string} message
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
 * @property {ParsedBoxError[]=} errors
 */

/**
 * @typedef {ArrayBuffer | ArrayBufferView} ISOBMFFByteChunk
 */

/**
 * Progressive byte sources supported by the public entry point.
 *
 * This intentionally mirrors usual browser and Node.js APIs:
 * - Blob/File inputs expose stream() and arrayBuffer()
 * - fetch Request/Response objects expose body and arrayBuffer()
 * - Node.js readable streams are AsyncIterable byte chunks
 *
 * @typedef {object} ISOBMFFBlobLike
 * @property {() => ReadableStream<ISOBMFFByteChunk>=} stream
 * @property {() => Promise<ArrayBuffer>=} arrayBuffer
 */

/**
 * @typedef {object} ISOBMFFBodyLike
 * @property {ReadableStream<ISOBMFFByteChunk> | AsyncIterable<ISOBMFFByteChunk> | Iterable<ISOBMFFByteChunk> | null=} body
 * @property {() => ReadableStream<ISOBMFFByteChunk>=} stream
 * @property {() => Promise<ArrayBuffer>=} arrayBuffer
 */

/**
 * @typedef {ReadableStream<ISOBMFFByteChunk> | AsyncIterable<ISOBMFFByteChunk> | Iterable<ISOBMFFByteChunk> | ISOBMFFBlobLike | ISOBMFFBodyLike} ISOBMFFProgressiveInput
 */

/**
 * @typedef {ISOBMFFByteChunk | ISOBMFFProgressiveInput} ISOBMFFInput
 */

export {};
