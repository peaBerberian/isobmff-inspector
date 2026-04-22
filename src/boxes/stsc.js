/**
 * @typedef {object} StscEntry
 * @property {number} first_chunk
 * @property {number} samples_per_chunk
 * @property {number} sample_description_index
 */

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample To Chunk",
  description:
    "Maps chunks to the number and description index of their samples.",

  parser(r) {
    // TODO: To new reader API
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.readUint(1);
    ret.flags = r.readUint(3);
    const entry_count = r.readUint(4);
    ret.entry_count = entry_count;

    /** @type {Array.<StscEntry>} */
    const entries = [];
    ret.entries = entries;
    let i = entry_count;
    while (i--) {
      const e = {
        first_chunk: r.readUint(4),
        samples_per_chunk: r.readUint(4),
        sample_description_index: r.readUint(4),
      };
      entries.push(e);
    }
    return ret;
  },
};
