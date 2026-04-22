import ftypBox from "./ftyp.js";

/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Segment Type Box",
  description: "Identifies the brands and compatibility of a media segment.",
  parser: ftypBox.parser,
};
