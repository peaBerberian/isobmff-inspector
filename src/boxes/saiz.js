/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample Auxiliary Information Sizes",
  description:
    "Gives per-sample sizes for auxiliary information such as encryption data.",

  parser(r) {
    // TODO: To new reader API
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.readUint(1);
    ret.flags = r.readUint(3);

    if (ret.flags === 1) {
      ret.aux_info_type = r.readUint(4);
      ret.aux_info_type_parameter = r.readUint(4);
    }

    ret.default_sample_info_size = r.readUint(1);
    const sample_count = r.readUint(4);
    ret.sample_count = sample_count;

    if (ret.default_sample_info_size === 0) {
      /** @type {Array.<number>} */
      const sample_info_size = [];
      ret.sample_info_size = sample_info_size;
      let i = sample_count;
      while (i--) {
        sample_info_size.push(r.readUint(1));
      }
    }

    return ret;
  },
};
