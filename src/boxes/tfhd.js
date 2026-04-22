/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Track Fragment Header Box",
  description:
    "Sets track-wide defaults and addressing for samples in a fragment.",

  parser(r) {
    // TODO: To new reader API
    /** @type Partial<Record<string, unknown>> */
    const ret = {};

    ret.version = r.readUint(1);
    const flags = r.readUint(3);

    const hasBaseDataOffset = flags & 0x000001;
    const hasSampleDescriptionIndex = flags & 0x000002;
    const hasDefaultSampleDuration = flags & 0x000008;
    const hasDefaultSampleSize = flags & 0x000010;
    const hasDefaultSampleFlags = flags & 0x000020;
    const durationIsEmpty = flags & 0x010000;
    const defaultBaseIsMOOF = flags & 0x020000;

    ret.flags = {
      "base-data-offset-present": !!hasBaseDataOffset,
      "sample-description-index-present": !!hasSampleDescriptionIndex,
      "default-sample-duration-present": !!hasDefaultSampleDuration,
      "default-sample-size-present": !!hasDefaultSampleSize,
      "default-sample-flags-present": !!hasDefaultSampleFlags,
      "duration-is-empty": !!durationIsEmpty,
      "default-base-is-moof": !!defaultBaseIsMOOF,
    };

    ret.track_ID = r.readUint(4);

    if (hasBaseDataOffset) {
      ret.base_data_offset = r.readUint64();
    }
    if (hasSampleDescriptionIndex) {
      ret.sample_description_index = r.readUint(4);
    }
    if (hasDefaultSampleDuration) {
      ret.default_sample_duration = r.readUint(4);
    }
    if (hasDefaultSampleSize) {
      ret.default_sample_size = r.readUint(4);
    }
    if (hasDefaultSampleFlags) {
      ret.default_sample_flags = r.readUint(4);
    }

    return ret;
  },
};
