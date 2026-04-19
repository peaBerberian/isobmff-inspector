/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Independent and Disposable Samples Box",
  description: "Records dependency flags for samples in decoding order.",

  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {
      version: r.bytesToInt(1),
      flags: r.bytesToInt(3),
    };

    const remaining = r.getRemainingLength();

    let i = remaining;

    /** @type Array<Partial<Record<string, unknown>>> */
    const samples = [];
    ret.samples = samples;
    while (i--) {
      const byte = r.bytesToInt(1);
      samples.push({
        is_leading: (byte >> 6) & 0x03,
        sample_depends_on: (byte >> 4) & 0x03,
        sample_is_depended_on: (byte >> 2) & 0x03,
        sample_has_redundancy: byte & 0x03,
      });
    }
    return ret;
  },
};
