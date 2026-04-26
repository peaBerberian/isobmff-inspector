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
    r.fieldUint("version", 1);
    r.fieldUint("flags", 3);
    const entry_count = r.fieldUint("entry_count", 4);

    /** @type {Array.<StscEntry>} */
    const entries = [];
    for (let i = 0; i < entry_count; i++) {
      const e = {
        first_chunk: r.readUint(4),
        samples_per_chunk: r.readUint(4),
        sample_description_index: r.readUint(4),
      };
      entries.push(e);
    }
    r.addField("entries", entries);
  },
};
