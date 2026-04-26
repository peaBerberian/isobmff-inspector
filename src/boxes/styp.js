import ftypBox from "./ftyp.js";
/**
 * @typedef {Object} SegmentTypeBoxContent
 * @property {string|number} major_brand
 * @property {number} minor_version
 * @property {Array<string|number>} compatible_brands
 */

/** @type {import("./types.js").BoxDefinition<SegmentTypeBoxContent>} */
export default {
  name: "Segment Type Box",
  description: "Identifies the brands and compatibility of a media segment.",
  parser: ftypBox.parser,
};
