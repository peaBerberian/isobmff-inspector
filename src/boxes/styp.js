import ftypBox from "./ftyp.js";
/**
 * @typedef {Object} SegmentTypeBoxContent
 * @property {string} major_brand
 * @property {number} minor_version
 * @property {string} compatible_brands
 */

/** @type {import("../types.js").BoxDefinition<SegmentTypeBoxContent>} */
export default {
  name: "Segment Type Box",
  description: "Identifies the brands and compatibility of a media segment.",
  parser: ftypBox.parser,
};
