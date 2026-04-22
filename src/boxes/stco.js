/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Chunk Offset",
  description: "Maps each media chunk to its 32-bit byte offset in the file.",

  parser(r) {
    // TODO: To new reader API
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.readUint(1);
    ret.flags = r.readUint(3);
    const entry_count = r.readUint(4);
    ret.entry_count = entry_count;

    /** @type {Array.<number>} */
    const chunk_offsets = [];
    ret.chunk_offsets = chunk_offsets;
    let i = entry_count;
    while (i--) {
      chunk_offsets.push(r.readUint(4));
    }
    return ret;
  },
};
