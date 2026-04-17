export default {
  name: "Chunk Large Offset Box",
  description: "",

  parser(r) {
    const version = r.bytesToInt(1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    const flags = r.bytesToInt(3);
    const entry_count = r.bytesToInt(4);
    const chunk_offsets = [];

    for (let i = 0; i < entry_count; i++) {
      chunk_offsets.push(r.bytesToUint64());
    }

    return {
      version,
      flags,
      entry_count,
      chunk_offsets,
    };
  },
};
