/** @typedef {{ [key: string]: unknown }} BoxParserFields */

/**
 * @typedef {object} ParsedFieldLocation
 * @property {number=} offset
 * @property {number=} byteLength
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "number",
 *   value: number,
 * }} ParsedNumberField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "bigint",
 *   value: bigint,
 * }} ParsedBigIntField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "string",
 *   value: string,
 * }} ParsedStringField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "bytes",
 *   value: string,
 * }} ParsedBytesField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "boolean",
 *   value: boolean,
 * }} ParsedBooleanField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "null",
 *   value: null,
 * }} ParsedNullField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "fixed-point",
 *   value: number,
 *   raw: number,
 *   format: string,
 *   signed: boolean,
 *   bits: number,
 * }} ParsedFixedPointField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "date",
 *   value: number | bigint,
 *   date: string | null,
 *   epoch: string,
 *   unit: "seconds",
 * }} ParsedDateField
 */

/**
 * @typedef {object} ParsedBitsFieldPartDefinition
 * @property {string} key
 * @property {number} bits
 */

/**
 * @typedef {object} ParsedBitsFieldPart
 * @property {string} key
 * @property {number} value
 * @property {number} bits
 * @property {number} shift
 * @property {number} mask
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "bits",
 *   value: number,
 *   raw: number,
 *   bits: number,
 *   fields: ParsedBitsFieldPart[],
 * }} ParsedBitsField
 */

/**
 * @typedef {object} ParsedFlagsFieldEntry
 * @property {string} key
 * @property {boolean} value
 * @property {number} mask
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "flags",
 *   value: number,
 *   raw: number,
 *   bits: number,
 *   flags: ParsedFlagsFieldEntry[],
 * }} ParsedFlagsField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "array",
 *   items: ParsedField[],
 * }} ParsedArrayField
 */

/**
 * @typedef {ParsedFieldLocation & {
 *   kind: "struct",
 *   fields: ParsedBoxValue[],
 *   layout?: string,
 * }} ParsedStructField
 */

/**
 * @typedef {ParsedNumberField | ParsedBigIntField | ParsedStringField | ParsedBytesField | ParsedBooleanField | ParsedNullField | ParsedFixedPointField | ParsedDateField | ParsedBitsField | ParsedFlagsField | ParsedArrayField | ParsedStructField} ParsedField
 */

/**
 * @typedef {{ key: string, description?: string } & ParsedField} ParsedBoxValue
 */

/**
 * @typedef {object} ParsedBoxIssue
 * @property {"warning" | "error"} severity
 * @property {string} message
 */

/**
 * @typedef {object} ParsedBox
 * @property {string} type
 * @property {number} offset
 * @property {number} size
 * @property {number} actualSize
 * @property {number} headerSize
 * @property {"size" | "largeSize" | "extendsToEnd"=} sizeField
 * @property {ParsedBoxValue[]} values
 * @property {string=} uuid
 * @property {string=} name
 * @property {string=} description
 * @property {ParsedBox[]=} children
 * @property {ParsedBoxIssue[]} issues
 */

/**
 * @typedef {object} ParseOptions
 * @property {"full" | "simple"=} format
 */

/**
 * Metadata describing a payload chunk forwarded while progressively consuming a
 * box payload.
 *
 * @typedef {object} BoxPayloadChunkInfo
 * @property {string[]} path
 * @property {string} type
 * @property {number} boxOffset
 * @property {number} boxSize
 * @property {number} headerSize
 * @property {"size" | "largeSize" | "extendsToEnd"=} sizeField
 * @property {string=} uuid
 * @property {number} payloadOffset
 * @property {number} payloadAbsoluteOffset
 */

/**
 * @callback BoxPayloadChunkCallback
 * @param {BoxPayloadChunkInfo} info
 * @param {Uint8Array} chunk
 * @returns {void | Promise<void>}
 */

/**
 * @typedef {object} ParseEventsPayloadOptions
 * @property {string[]} include
 * @property {BoxPayloadChunkCallback} onChunk
 */

/**
 * @typedef {object} ParseEventsOptions
 * @property {ParseEventsPayloadOptions=} payloads
 */

/**
 * @typedef {object} SimpleParsedBox
 * @property {string} type
 * @property {number} offset
 * @property {number} size
 * @property {number} actualSize
 * @property {number} headerSize
 * @property {"size" | "largeSize" | "extendsToEnd"=} sizeField
 * @property {string=} uuid
 * @property {Record<string, unknown>} fields
 * @property {SimpleParsedBox[]=} children
 * @property {ParsedBoxIssue[]=} issues
 */

/**
 * Emitted as soon as a box header has been parsed.
 *
 * @typedef {object} ParsedBoxStartEvent
 * @property {"box-start"} event
 * @property {string[]} path
 * @property {string} type
 * @property {number} offset
 * @property {number} size
 * @property {number} headerSize
 * @property {"size" | "largeSize" | "extendsToEnd"=} sizeField
 * @property {string=} uuid
 */

/**
 * Emitted when a box has been parsed, or when parsing cannot continue after a
 * malformed partial box.
 *
 * @typedef {object} ParsedBoxCompleteEvent
 * @property {"box-complete"} event
 * @property {string[]} path
 * @property {ParsedBox} box
 */

/**
 * @typedef {ParsedBoxStartEvent | ParsedBoxCompleteEvent} ParsedBoxParseEvent
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

// Force module detection
export {};
