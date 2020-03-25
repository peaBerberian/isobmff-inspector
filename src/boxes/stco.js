export default {
  name: "Chunk Offset",
  description: "",

  parser(r) {
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);
    ret.entry_count = r.bytesToInt(4);
    ret.chunk_offsets = [];
    let i = ret.entry_count;
    while (i--) {
      ret.chunk_offsets.push(r.bytesToInt(4));
    }
    return ret;
  },
};
