/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample Auxiliary Information Offsets",
  description:
    "Gives file offsets for auxiliary sample information such as encryption data.",

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

    const entry_count = r.readUint(4);
    ret.entry_count = entry_count;

    /** @type {Array.<number|bigint>} */
    const offset = [];
    ret.offset = offset;
    let i = entry_count;
    while (i--) {
      offset.push(ret.version === 0 ? r.readUint(4) : r.readInt64());
    }

    return ret;
  },
};
