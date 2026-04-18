/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Handler Reference Box",
  description:
    "This box within a Media Box declares media type of the track, " +
    "and thus the process by which the media‐data in the track is presented",

  parser(r) {
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
