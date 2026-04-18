/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Colour Information Box",
  description: "",

  parser(r) {
    const colour_type = r.bytesToASCII(4);
    /** @type Partial<Record<string, unknown>> */
    const ret = { colour_type };

    if (colour_type === "nclx" || colour_type === "nclc") {
      ret.colour_primaries = r.bytesToInt(2);
      ret.transfer_characteristics = r.bytesToInt(2);
      ret.matrix_coefficients = r.bytesToInt(2);

      if (!r.isFinished()) {
        ret.full_range_flag = !!(r.bytesToInt(1) & 0x80);
      }
    } else if (!r.isFinished()) {
      ret.data = r.bytesToHex(r.getRemainingLength());
    }

    return ret;
  },
};
