/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Chunk Offset",
  description: "",

  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);
    const entry_count = r.bytesToInt(4);
    ret.entry_count = entry_count;

    /** @type {Array.<number>} */
    const chunk_offsets = [];
    ret.chunk_offsets = chunk_offsets;
    let i = entry_count;
    while (i--) {
      chunk_offsets.push(r.bytesToInt(4));
    }
    return ret;
  },
};
