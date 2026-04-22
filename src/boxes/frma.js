/**
 * @typedef {Object} OriginalFormatBoxContent
 * @property {string} original_format
 */

/** @type {import("../types.js").BoxDefinition<OriginalFormatBoxContent>} */
export default {
  name: "Original Format Box",
  description: "Identifies the coding format before protection was applied.",

  parser(reader) {
    reader.fieldFourCc("original_format");
  },
};
