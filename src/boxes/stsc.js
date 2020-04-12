export default {
  name: "Sample To Chunk",
  description: "",

  parser(r) {
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);
    ret.entry_count = r.bytesToInt(4);
    ret.entries = [];
    let i = ret.entry_count;
    while (i--) {
      const e = {};
      e.first_chunk = r.bytesToInt(4);
      e.samples_per_chunk = r.bytesToInt(4);
      e.sample_description_index = r.bytesToInt(4);
      ret.entries.push(e);
    }
    return ret;
  },
};
