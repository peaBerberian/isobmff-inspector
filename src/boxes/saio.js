/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Sample Auxiliary Information Offsets",
  description:
    "Gives file offsets for auxiliary sample information such as encryption data.",

  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);

    if (ret.flags === 1) {
      ret.aux_info_type = r.bytesToInt(4);
      ret.aux_info_type_parameter = r.bytesToInt(4);
    }

    const entry_count = r.bytesToInt(4);
    ret.entry_count = entry_count;

    /** @type {Array.<number>} */
    const offset = [];
    ret.offset = offset;
    let i = entry_count;
    while (i--) {
      offset.push(r.bytesToInt(ret.version === 0 ? 4 : 8));
    }

    return ret;
  },
};
