/**
 * @typedef {Object} TrackExtensionPropertiesBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} track_ID
 */

/** @type {import("../types.js").BoxDefinition<TrackExtensionPropertiesBoxContent>} */
export default {
  name: "Track Extension Properties Box",
  description:
    "Carries extra properties associated with a movie-fragment track.",
  container: true,

  parser(r) {
    r.fieldUint("version", 1, "trep box version. Should be `0`.");
    r.fieldUint("flags", 3, "trep box flags. Should be `0`.");
    r.fieldUint(
      "track_ID",
      4,
      "The track ID concerned by this box and its children.",
    );
  },
};
