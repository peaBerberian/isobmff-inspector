/**
 * @typedef {Object} MovieFragmentHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} sequence_number
 */

/** @type {import("./types.js").BoxDefinition<MovieFragmentHeaderBoxContent>} */
export default {
  name: "Movie Fragment Header Box",
  description:
    "This box contains just a sequence number (usually starting at 1), as a safety check.",

  parser(r) {
    r.fieldUint("version", 1, "mfhd box version");
    r.fieldUint("flags", 3, "mfhd box flags");
    r.fieldUint(
      "sequence_number",
      4,
      "sequence number associated with the current fragment",
    );
  },
};
