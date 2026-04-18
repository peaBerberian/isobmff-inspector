/**
 * @typedef {object} SttsEntry
 * @property {number} sample_count
 * @property {number} sample_delta
 */

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Decoding Time to Sample",
  description: "",

  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);
    const entry_count = r.bytesToInt(4);
    ret.entry_count = entry_count;

    /** @type {Array.<SttsEntry>} */
    const entries = [];
    ret.entries = entries;
    let i = entry_count;
    while (i--) {
      entries.push({
        sample_count: r.bytesToInt(4),
        sample_delta: r.bytesToInt(4),
      });
    }
    return ret;
  },
};
