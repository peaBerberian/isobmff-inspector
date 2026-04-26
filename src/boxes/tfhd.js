/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Track Fragment Header Box",
  description:
    "Sets track-wide defaults and addressing for samples in a fragment.",

  parser(r) {
    r.fieldUint("version", 1);
    const flags = r.fieldFlags("flags", 3, {
      "base-data-offset-present": 0x000001,
      "sample-description-index-present": 0x000002,
      "default-sample-duration-present": 0x000008,
      "default-sample-size-present": 0x000010,
      "default-sample-flags-present": 0x000020,
      "duration-is-empty": 0x010000,
      "default-base-is-moof": 0x020000,
    });

    r.fieldUint("track_ID", 4);

    if (flags & 0x000001) {
      r.fieldUint64("base_data_offset");
    }
    if (flags & 0x000002) {
      r.fieldUint("sample_description_index", 4);
    }
    if (flags & 0x000008) {
      r.fieldUint("default_sample_duration", 4);
    }
    if (flags & 0x000010) {
      r.fieldUint("default_sample_size", 4);
    }
    if (flags & 0x000020) {
      r.fieldUint("default_sample_flags", 4);
    }
  },
};
