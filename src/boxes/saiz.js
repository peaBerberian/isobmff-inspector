/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample Auxiliary Information Sizes",
  description:
    "Gives per-sample sizes for auxiliary information such as encryption data.",

  parser(r) {
    r.fieldUint("version", 1);
    const flags = r.fieldUint("flags", 3);

    if (flags === 1) {
      r.fieldUint("aux_info_type", 4);
      r.fieldUint("aux_info_type_parameter", 4);
    }

    const default_sample_info_size = r.fieldUint("default_sample_info_size", 1);
    const sample_count = r.fieldUint("sample_count", 4);

    if (default_sample_info_size === 0) {
      /** @type {Array.<number>} */
      const sample_info_size = [];
      const sampleInfoSizeOffset = r.getCurrentOffset();
      for (let i = 0; i < sample_count; i++) {
        sample_info_size.push(r.readUint(1));
      }
      r.addField("sample_info_size", sample_info_size, {
        offset: sampleInfoSizeOffset,
        byteLength: r.getCurrentOffset() - sampleInfoSizeOffset,
      });
    }
  },
};
