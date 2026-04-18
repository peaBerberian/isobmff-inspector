/**
 * @typedef {object} StscEntry
 * @property {number} first_chunk
 * @property {number} samples_per_chunk
 * @property {number} sample_description_index
 */

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Sample To Chunk",
  description: "",

  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);
    const entry_count = r.bytesToInt(4);
    ret.entry_count = entry_count;

    /** @type {Array.<StscEntry>} */
    const entries = [];
    ret.entries = entries;
    let i = entry_count;
    while (i--) {
      const e = {
        first_chunk: r.bytesToInt(4),
        samples_per_chunk: r.bytesToInt(4),
        sample_description_index: r.bytesToInt(4),
      };
      entries.push(e);
    }
    return ret;
  },
};
