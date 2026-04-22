/**
 * @typedef {Object} ChunkLargeOffsetBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 * @property {Array<bigint>} chunk_offsets
 */

/** @type {import("../types.js").BoxDefinition<ChunkLargeOffsetBoxContent>} */
export default {
  name: "Chunk Large Offset Box",
  description: "Maps each media chunk to its 64-bit byte offset in the file.",

  parser(reader) {
    const version = reader.fieldUint(
      "version",
      1,
      "This box's version. Should be `0` for this box.",
    );
    if (version !== 0) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3);
    const entry_count = reader.fieldUint(
      "entry_count",
      4,
      "Number of chunk offsets declared",
    );
    const chunk_offsets = [];
    for (let i = 0; i < entry_count; i++) {
      chunk_offsets.push(reader.bytesToUint64BigInt());
    }
    reader.addField("chunk_offsets", chunk_offsets);
  },
};
