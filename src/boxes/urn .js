/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Data Entry Url Box",
  description:
    "declare the location(s) of the media data used within the presentation.",
  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);

    const remaining = r.getRemainingLength();

    // TODO Check NULL-terminated stream for name+location
    // might also check flags for that
    if (remaining) {
      ret.name = r.bytesToASCII(remaining);
    }
    return ret;
  },
};
