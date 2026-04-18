/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Sample Size",
  description: "",

  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);

    ret.sample_size = r.bytesToInt(4);
    const sample_count = r.bytesToInt(4);
    ret.sample_count = sample_count;
    if (ret.sample_size === 0) {
      /** @type {Array.<number>} */
      const entries = [];
      ret.entries = entries;
      let i = sample_count;
      while (i--) {
        entries.push(r.bytesToInt(4));
      }
    }
    return ret;
  },
};
