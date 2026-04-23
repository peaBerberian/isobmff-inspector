/**
 * @typedef {Object} TrackExtendsBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} track_ID
 * @property {number} default_sample_description_index
 * @property {number} default_sample_duration
 * @property {number} default_sample_size
 * @property {number} default_sample_flags
 */

/** @type {import("./types.js").BoxDefinition<TrackExtendsBoxContent>} */
export default {
  name: "Track Extends Box",
  description:
    "sets up default values used by the movie fragments. " +
    "By setting defaults in this way, space and complexity can be saved " +
    "in each Track Fragment Box",

  parser(reader) {
    reader.fieldUint("version", 1, "trex box version");
    reader.fieldUint("flags", 3, "trex box flags");
    reader.fieldUint("track_ID", 4, "track ID to which those settings apply");
    reader.fieldUint("default_sample_description_index", 4);
    reader.fieldUint("default_sample_duration", 4);
    reader.fieldUint("default_sample_size", 4);
    reader.fieldUint("default_sample_flags", 4);
  },
};
