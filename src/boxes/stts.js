/**
 * @typedef {object} DecodingTimeToSampleBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 * @property {Array<SttsEntry>} entries
 */

/**
 * @typedef {object} SttsEntry
 * @property {number} sample_count
 * @property {number} sample_delta
 */

/** @type {import("./types.js").BoxDefinition<DecodingTimeToSampleBoxContent>} */
export default {
  name: "Decoding Time to Sample",
  description: "Maps consecutive samples to their decoding-time deltas.",

  parser(r) {
    r.fieldUint("version", 1, "stts box version");
    r.fieldUint("flags", 3, "stts box flags");
    const entry_count = r.fieldUint("entry_count", 4);

    /** @type {Array.<SttsEntry>} */
    const entries = [];
    let i = entry_count;
    while (i--) {
      entries.push({
        sample_count: r.readUint(4),
        sample_delta: r.readUint(4),
      });
    }
    r.addField("entries", entries);
  },
};
