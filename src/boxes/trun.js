/**
 * @typedef {object} TrunSample
 * @property {number} [sample_duration]
 * @property {number} [sample_size]
 * @property {number} [sample_flags]
 * @property {number} [sample_composition_time_offset]
 */

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Track Fragment Run Box",
  description:
    "Lists sample records and optional per-sample data for a track fragment.",

  parser(r) {
    const version = r.fieldUint("version", 1);

    const flags = r.fieldFlags("flags", 3, {
      "data-offset-present": 0x000001,
      "first-sample-flags-present": 0x000004,
      "sample-duration-present": 0x000100,
      "sample-size-present": 0x000200,
      "sample-flags-present": 0x000400,
      "sample-composition-time-offset-present": 0x000800,
    });

    const sample_count = r.fieldUint("sample_count", 4);

    if (flags & 0x000001) {
      r.addField("data_offset", ~~r.readUint(4));
    }
    if (flags & 0x000004) {
      r.addField("first_sample_flags", r.readUint(4));
    }

    /** @type {Array.<TrunSample>} */
    const samples = [];
    for (let i = 0; i < sample_count; i++) {
      /** @type {TrunSample} */
      const sample = {};

      if (flags & 0x000100) {
        sample.sample_duration = r.readUint(4);
      }
      if (flags & 0x000200) {
        sample.sample_size = r.readUint(4);
      }
      if (flags & 0x000400) {
        sample.sample_flags = r.readUint(4);
      }
      if (flags & 0x000800) {
        sample.sample_composition_time_offset =
          version === 0 ? r.readUint(4) : ~~r.readUint(4);
      }
      samples.push(sample);
    }
    r.addField("samples", samples);
  },
};
