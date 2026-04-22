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
    // TODO: To new reader API
    const version = r.readUint(1);
    return {
      version,
      flags: r.readUint(3),
      baseMediaDecodeTime: version ? r.readUint64() : r.readUint(4),
    };
  },
};
