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
      r.addField("base_data_offset", r.readUint64());
    }
    if (flags & 0x000002) {
      r.addField("sample_description_index", r.readUint(4));
    }
    if (flags & 0x000008) {
      r.addField("default_sample_duration", r.readUint(4));
    }
    if (flags & 0x000010) {
      r.addField("default_sample_size", r.readUint(4));
    }
    if (flags & 0x000020) {
      r.addField("default_sample_flags", r.readUint(4));
    }
  },
};
