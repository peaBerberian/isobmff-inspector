export default {
  name: "Decoding Time to Sample",
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
      e.sample_count = r.bytesToInt(4);
      e.sample_delta = r.bytesToInt(4);
      ret.entries.push(e);
    }
    return ret;
  },
};
