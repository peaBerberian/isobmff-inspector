/**
 * @typedef {Object} TrackFragmentDecodeTimeBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number|bigint} baseMediaDecodeTime
 */

/** @type {import("./types.js").BoxDefinition<TrackFragmentDecodeTimeBoxContent>} */
export default {
  name: "Track Fragment Decode Time",
  description:
    "The absolute decode time, measured on the media timeline, of " +
    "the first sample in decode order in the track fragment",
  parser(r) {
    const version = r.fieldUint("version", 1);
    r.fieldUint("flags", 3);
    if (version) {
      r.fieldUint64("baseMediaDecodeTime");
    } else {
      r.fieldUint("baseMediaDecodeTime", 4);
    }
  },
};
