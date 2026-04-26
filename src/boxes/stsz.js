/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample Size",
  description: "Stores the default sample size or a table of per-sample sizes.",

  parser(r) {
    r.fieldUint("version", 1);
    r.fieldUint("flags", 3);

    const sample_size = r.fieldUint("sample_size", 4);
    const sample_count = r.fieldUint("sample_count", 4);
    if (sample_size === 0) {
      /** @type {Array.<number>} */
      const entries = [];
      for (let i = 0; i < sample_count; i++) {
        entries.push(r.readUint(4));
      }
      r.addField("entries", entries);
    }
  },
};
