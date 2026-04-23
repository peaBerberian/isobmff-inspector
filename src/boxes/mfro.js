/**
 * @typedef {Object} MovieFragmentRandomAccessOffsetBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} size
 */

/** @type {import("./types.js").BoxDefinition<MovieFragmentRandomAccessOffsetBoxContent>} */
export default {
  name: "Movie Fragment Random Access Offset Box",
  description:
    "Stores the enclosing mfra box size to make footer-style lookup easier.",

  parser(reader) {
    reader.fieldUint("version", 1, "mfro box version");
    reader.fieldUint("flags", 3, "mfro box flags");
    reader.fieldUint("size", 4, "Size in bytes of the enclosing mfra box");
  },
};
