/**
 * @typedef {object} TrunSample
 * @property {number} [sample_duration]
 * @property {number} [sample_size]
 * @property {number} [sample_flags]
 * @property {number} [sample_composition_time_offset]
 */

/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Track Fragment Run Box",
  description:
    "Lists sample records and optional per-sample data for a track fragment.",

  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.bytesToInt(1);

    const flags = r.bytesToInt(3);

    const hasDataOffset = flags & 0x000001;
    const hasFirstSampleFlags = flags & 0x000004;
    const hasSampleDuration = flags & 0x000100;
    const hasSampleSize = flags & 0x000200;
    const hasSampleFlags = flags & 0x000400;
    const hasSampleCompositionOffset = flags & 0x000800;

    ret.flags = {
      "data-offset-present": !!hasDataOffset,
      "first-sample-flags-present": !!hasFirstSampleFlags,
      "sample-duration-present": !!hasSampleDuration,
      "sample-size-present": !!hasSampleSize,
      "sample-flags-present": !!hasSampleFlags,
      "sample-composition-time-offset-present": !!hasSampleCompositionOffset,
    };

    const sample_count = r.bytesToInt(4);
    ret.sample_count = sample_count;

    // two's complement
    if (hasDataOffset) {
      ret.data_offset = ~~r.bytesToInt(4);
    }

    if (hasFirstSampleFlags) {
      ret.first_sample_flags = r.bytesToInt(4);
    }

    let i = sample_count;
    /** @type {Array.<TrunSample>} */
    const samples = [];
    ret.samples = samples;
    while (i--) {
      /** @type {TrunSample} */
      const sample = {};

      if (hasSampleDuration) {
        sample.sample_duration = r.bytesToInt(4);
      }
      if (hasSampleSize) {
        sample.sample_size = r.bytesToInt(4);
      }
      if (hasSampleFlags) {
        sample.sample_flags = r.bytesToInt(4);
      }
      if (hasSampleCompositionOffset) {
        sample.sample_composition_time_offset =
          ret.version === 0 ? r.bytesToInt(4) : ~~r.bytesToInt(4);
      }
      samples.push(sample);
    }

    return ret;
  },
};
