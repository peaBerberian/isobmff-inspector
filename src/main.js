import parse from "./api/index.js";

// Re-export types:

/**
 * @typedef {import("./types.js").ParsedBox} ParsedBox
 * @typedef {import("./types.js").SimpleParsedBox} SimpleParsedBox
 * @typedef {import("./types.js").ParsedBoxValue} ParsedBoxValue
 * @typedef {import("./types.js").ParsedField} ParsedField
 * @typedef {import("./types.js").ParsedBoxIssue} ParsedBoxIssue
 * @typedef {import("./types.js").ParseOptions} ParseOptions
 * @typedef {import("./types.js").ParsedBoxParseEvent} ParsedBoxParseEvent
 * @typedef {import("./types.js").ParsedBoxStartEvent} ParsedBoxStartEvent
 * @typedef {import("./types.js").ParsedBoxCompleteEvent} ParsedBoxCompleteEvent
 * @typedef {import("./types.js").ISOBMFFInput} ISOBMFFInput
 * @typedef {import("./types.js").ISOBMFFByteChunk} ISOBMFFByteChunk
 * @typedef {import("./types.js").ISOBMFFProgressiveInput} ISOBMFFProgressiveInput
 */

export * from "./api/index.js";
export default parse;
