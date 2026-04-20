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
 * @typedef {object} ParsedBoxFieldMetadata
 * @property {string=} description
 */

/**
 * Field-aware reader passed to box parsers.
 *
 * The bytesTo* methods are inherited for compatibility and only consume input.
 * The named methods consume input and append a public ParsedBoxValue in call
 * order. field() appends a derived value without consuming input.
 *
 * @typedef {object} BoxReaderFields
 * @property {(key: string, value: unknown, meta?: string | ParsedBoxFieldMetadata) => unknown} field
 * @property {(key: string, nbBytes: number, meta?: string | ParsedBoxFieldMetadata) => number} uint
 * @property {(key: string, meta?: string | ParsedBoxFieldMetadata) => bigint} uint64
 * @property {(key: string, meta?: string | ParsedBoxFieldMetadata) => bigint} int64
 * @property {(key: string, nbBytes: number, meta?: string | ParsedBoxFieldMetadata) => string} hex
 * @property {(key: string, nbBytes: number, meta?: string | ParsedBoxFieldMetadata) => string} ascii
 * @property {(key: string, nbBytes: number, fractionalBits: number, format: string, meta?: string | ParsedBoxFieldMetadata) => ParsedFixedPointField} fixedPoint
 * @property {(key: string, nbBytes: number, bits: number, fractionalBits: number, format: string, meta?: string | ParsedBoxFieldMetadata) => ParsedFixedPointField} signedFixedPoint
 * @property {(key: string, nbBytes: number, meta?: string | ParsedBoxFieldMetadata) => ParsedDateField} macDate
 * @property {() => ParsedBoxValue[]} getValues
 */

/**
 * @typedef {BufferReader & BoxReaderFields} BoxReader
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
 * @typedef {object} ParsedUnknownField
 * @property {"unknown"} kind
 * @property {unknown} value
 */

/**
 * @typedef {object} ParsedFixedPointField
 * @property {"fixed-point"} kind
 * @property {number} value
 * @property {number} raw
 * @property {string} format
 * @property {boolean} signed
 * @property {number=} bits
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
 * @typedef {ParsedNumberField | ParsedBigIntField | ParsedStringField | ParsedBooleanField | ParsedNullField | ParsedUnknownField | ParsedFixedPointField | ParsedDateField | ParsedArrayField | ParsedStructField} ParsedField
 */

/**
 * @typedef {{ key: string, description?: string } & ParsedField} ParsedBoxValue
 */

/**
 * @template {{ [k: string]: unknown }} T
 * @typedef {object} BoxDefinition
 * @property {string=} name
 * @property {string=} description
 * @property {BoxContentEntry[]=} content
 * @property {boolean=} container
 * @property {(reader: BoxReader) => T | void=} parser
 */

/**
 * @typedef {Record<string, BoxDefinition<{ [k: string]: unknown }>>} BoxDefinitionsMap
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

export {};
