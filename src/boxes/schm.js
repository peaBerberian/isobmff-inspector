/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Scheme Type Box",
  description:
    "Identifies the protection or restriction scheme and its version.",

  parser(r) {
    const version = r.bytesToInt(1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    const flags = r.bytesToInt(3);
    /** @type Partial<Record<string, unknown>> */
    const ret = {
      version,
      flags,
      scheme_type: r.bytesToASCII(4),
      scheme_version: r.bytesToInt(4),
    };

    if (flags & 0x000001) {
      ret.scheme_uri = r
        .bytesToASCII(r.getRemainingLength())
        .replace(/\0+$/, "");
    }

    return ret;
  },
};
