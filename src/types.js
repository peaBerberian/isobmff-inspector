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
 * The bytesTo* methods are inherited for compatibility. read* methods consume
 * input without emitting fields. field* methods consume input and append a
 * public ParsedBoxValue in call order. addField() appends a derived value
 * without consuming input.
 *
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: number extends T[K] ? K : never }[Extract<keyof T, string>]} NumberKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: bigint extends T[K] ? K : never }[Extract<keyof T, string>]} BigIntKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: string extends T[K] ? K : never }[Extract<keyof T, string>]} StringKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: ParsedFixedPointField extends T[K] ? K : never }[Extract<keyof T, string>]} FixedPointKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: ParsedDateField extends T[K] ? K : never }[Extract<keyof T, string>]} DateKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: ParsedBitsField extends T[K] ? K : never }[Extract<keyof T, string>]} BitsKeys
 */

/**
 * @template T
 * @typedef {{ [K in Extract<keyof T, string>]: ParsedFlagsField extends T[K] ? K : never }[Extract<keyof T, string>]} FlagsKeys
 */

/**
 * @template {{ [k: string]: unknown }} T
 * @typedef {object} BoxReaderFields
 * @property {<K extends Extract<keyof T, string>>(key: K, value: T[K], meta?: string | ParsedBoxFieldMetadata) => T[K]} addField
 * @property {(nbBytes: number) => number} readUint
 * @property {() => bigint} readUint64
 * @property {() => bigint} readInt64
 * @property {(nbBytes: number) => string} readHex
 * @property {(nbBytes: number) => string} readAscii
 * @property {<K extends NumberKeys<T>>(key: K, nbBytes: number, meta?: string | ParsedBoxFieldMetadata) => number} fieldUint
 * @property {<K extends BigIntKeys<T>>(key: K, meta?: string | ParsedBoxFieldMetadata) => bigint} fieldUint64
 * @property {<K extends BigIntKeys<T>>(key: K, meta?: string | ParsedBoxFieldMetadata) => bigint} fieldInt64
 * @property {<K extends StringKeys<T>>(key: K, nbBytes: number, meta?: string | ParsedBoxFieldMetadata) => string} fieldHex
 * @property {<K extends StringKeys<T>>(key: K, nbBytes: number, meta?: string | ParsedBoxFieldMetadata) => string} fieldAscii
 * @property {<K extends FixedPointKeys<T>>(key: K, nbBytes: number, fractionalBits: number, format: string, meta?: string | ParsedBoxFieldMetadata) => ParsedFixedPointField} fieldFixedPoint
 * @property {<K extends FixedPointKeys<T>>(key: K, nbBytes: number, bits: number, fractionalBits: number, format: string, meta?: string | ParsedBoxFieldMetadata) => ParsedFixedPointField} fieldSignedFixedPoint
 * @property {<K extends DateKeys<T>>(key: K, nbBytes: number, meta?: string | ParsedBoxFieldMetadata) => ParsedDateField} fieldMacDate
 * @property {<K extends BitsKeys<T>>(key: K, nbBytes: number, parts: ParsedBitsFieldPartDefinition[], meta?: string | ParsedBoxFieldMetadata) => number} fieldBits
 * @property {<K extends FlagsKeys<T>>(key: K, nbBytes: number, flags: Record<string, number>, meta?: string | ParsedBoxFieldMetadata) => number} fieldFlags
 * @property {() => ParsedBoxValue[]} getValues
 */

/**
 * @template {{ [k: string]: unknown }} T
 * @typedef {BufferReader & BoxReaderFields<T>} BoxReader
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
 * @template {{ [k: string]: unknown }} T
 * @typedef {object} BoxDefinition
 * @property {string=} name
 * @property {string=} description
 * @property {BoxContentEntry[]=} content
 * @property {boolean=} container
 * @property {(reader: BoxReader<T>) => T | void=} parser
 */

/**
 * @typedef {Record<string, any>} BoxDefinitionsMap
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

export {};
