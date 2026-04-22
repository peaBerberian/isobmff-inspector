/**
 * @typedef {Object} ColorInformationBoxContent
 * @property {string} colour_type
 * @property {number=} colour_primaries
 * @property {number=} transfer_characteristics
 * @property {number=} matrix_coefficients
 * @property {boolean=} full_range_flag
 * @property {string=} data
 */

/** @type {import("../types.js").BoxDefinition<ColorInformationBoxContent>} */
export default {
  name: "Colour Information Box",
  description: "Signals the colour representation used by visual samples.",

  parser(reader) {
    const colour_type = reader.fieldAscii("colour_type", 4);
    if (colour_type === "nclx" || colour_type === "nclc") {
      reader.fieldUint("colour_primaries", 2);
      reader.fieldUint("transfer_characteristics", 2);
      reader.fieldUint("matrix_coefficients", 2);
      if (!reader.isFinished()) {
        // XXX TODO:
        ret.full_range_flag = !!(reader.bytesToInt(1) & 0x80);
      }
    } else if (!reader.isFinished()) {
      reader.fieldHex("data", reader.getRemainingLength());
    }
  },
};
