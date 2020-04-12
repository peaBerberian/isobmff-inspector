export default {
  name: "Sample Size",
  description: "",

  parser(r) {
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);

    ret.sample_size = r.bytesToInt(4);
    ret.sample_count = r.bytesToInt(4);
    if (ret.sample_size == 0)
    {
      ret.entries = [];
      let i = ret.sample_count;
      while (i--) {
        ret.entries.push(r.bytesToInt(4));
      }
    }
    return ret;
  },
};
