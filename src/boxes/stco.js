/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Chunk Offset",
  description: "Maps each media chunk to its 32-bit byte offset in the file.",

  parser(r) {
    r.fieldUint("version", 1);
    r.fieldUint("flags", 3);
    const entry_count = r.fieldUint("entry_count", 4);

    /** @type {Array.<number>} */
    const chunk_offsets = [];
    for (let i = 0; i < entry_count; i++) {
      chunk_offsets.push(r.readUint(4));
    }
    r.addField("chunk_offsets", chunk_offsets);
  },
};
