/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Handler Reference Box",
  description:
    "Identifies the handler type for the track or metadata it belongs to.",

  parser(r) {
    /** @type Partial<Record<string, unknown>> */
    const ret = {
      version: r.bytesToInt(1),
      flags: r.bytesToInt(3),
      pre_defined: r.bytesToInt(4),
      handler_type: r.bytesToInt(4),
      reserved: [r.bytesToInt(4), r.bytesToInt(4), r.bytesToInt(4)],
    };

    const remaining = r.getRemainingLength();
    if (remaining > 0) {
      ret.name = r.bytesToASCII(remaining);
    }

    return ret;
  },
};
