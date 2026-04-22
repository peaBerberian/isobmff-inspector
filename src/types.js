/** @typedef {{ [key: string]: unknown }} BoxParserFields */

/**
 * @typedef {object} ParsedNumberField
 * @property {"number"} kind
 * @property {number} value
 */

/**
 * @typedef {object} ParsedBigIntField
 * @property {"bigint"} kind
 * @property {bigint} value
 */

/**
 * @typedef {object} ParsedStringField
 * @property {"string"} kind
 * @property {string} value
 */

/**
 * @typedef {object} ParsedBooleanField
 * @property {"boolean"} kind
 * @property {boolean} value
 */

/**
 * @typedef {object} ParsedNullField
 * @property {"null"} kind
 * @property {null} value
 */

/**
 * @typedef {object} ParsedFixedPointField
 * @property {"fixed-point"} kind
 * @property {number} value
 * @property {number} raw
 * @property {string} format
 * @property {boolean} signed
 * @property {number} bits
 */

/**
 * @typedef {object} ParsedDateField
 * @property {"date"} kind
 * @property {number | bigint} value
 * @property {string | null} date
 * @property {string} epoch
 * @property {"seconds"} unit
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
 * @typedef {object} ParsedBitsField
 * @property {"bits"} kind
 * @property {number} value
 * @property {number} raw
 * @property {number} bits
 * @property {ParsedBitsFieldPart[]} fields
 */

/**
 * @typedef {object} ParsedFlagsFieldEntry
 * @property {string} key
 * @property {boolean} value
 * @property {number} mask
 */

/**
 * @typedef {object} ParsedFlagsField
 * @property {"flags"} kind
 * @property {number} value
 * @property {number} raw
 * @property {number} bits
 * @property {ParsedFlagsFieldEntry[]} flags
 */

/**
 * @typedef {object} ParsedArrayField
 * @property {"array"} kind
 * @property {ParsedField[]} items
 */

/**
 * @typedef {object} ParsedStructField
 * @property {"struct"} kind
 * @property {ParsedBoxValue[]} fields
 * @property {string=} layout
 */

/**
 * @typedef {ParsedNumberField | ParsedBigIntField | ParsedStringField | ParsedBooleanField | ParsedNullField | ParsedFixedPointField | ParsedDateField | ParsedBitsField | ParsedFlagsField | ParsedArrayField | ParsedStructField} ParsedField
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
 * @typedef {object} SimpleParsedBox
 * @property {string} type
 * @property {number} offset
 * @property {number} size
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
