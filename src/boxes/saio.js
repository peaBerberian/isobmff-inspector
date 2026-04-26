/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample Auxiliary Information Offsets",
  description:
    "Gives file offsets for auxiliary sample information such as encryption data.",

  parser(r) {
    const version = r.fieldUint("version", 1);
    const flags = r.fieldUint("flags", 3);

    if (flags === 1) {
      r.fieldUint("aux_info_type", 4);
      r.fieldUint("aux_info_type_parameter", 4);
    }

    const entry_count = r.fieldUint("entry_count", 4);

    /** @type {Array.<number|bigint>} */
    const offset = [];
    for (let i = 0; i < entry_count; i++) {
      offset.push(version === 0 ? r.readUint(4) : r.readInt64());
    }
    r.addField("offset", offset);
  },
};
