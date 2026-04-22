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
    // TODO: To new reader API
    return {
      version: reader.readUint(1),
      flags: reader.readUint(3),
      track_ID: reader.readUint(4),
      default_sample_description_index: reader.readUint(4),
      default_sample_duration: reader.readUint(4),
      default_sample_size: reader.readUint(4),
      default_sample_flags: reader.readUint(4),
    };
  },
};
