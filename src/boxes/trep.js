/**
 * @typedef {Object} TrackExtensionPropertiesBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} track_id
 */

/** @type {import("../types.js").BoxDefinition<TrackExtensionPropertiesBoxContent>} */
export default {
  name: "Track Extension Properties Box",
  description:
    "Carries extra properties associated with a movie-fragment track.",
  container: true,

  parser(r) {
    return {
      version: r.bytesToInt(1),
      flags: r.bytesToInt(3),
      track_id: r.bytesToInt(4),
    };
  },
};
