/**
 * @typedef {Object} MovieHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number|bigint} fragment_duration
 */

/** @type {import("../types.js").BoxDefinition<MovieHeaderBoxContent>} */
export default {
  name: "Movie Extends Header Box",
  description:
    "Provides the overall duration, including fragments, of a " +
    "fragmented movie. If this box is not present, the overall duration must " +
    "be computed by examining each fragment.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "mehd box version");
    if (version > 1) {
      throw new Error("invalid version");
    }
    reader.fieldUint("version", 3, "mehd box flags. Should be 0.");
    if (version === 1) {
      reader.fieldUint64("fragment_duration");
    } else {
      reader.fieldUint("fragment_duration", 4);
    }
  },
};
