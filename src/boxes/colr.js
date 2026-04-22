/**
 * @typedef {Object} ColorInformationBoxContent
 * @property {string} colour_type
 * @property {number=} colour_primaries
 * @property {number=} transfer_characteristics
 * @property {number=} matrix_coefficients
 * @property {import("../types.js").ParsedBitsField=} full_range_flag
 * @property {string=} ICC_profile
 */

/** @type {import("./types.js").BoxDefinition<ColorInformationBoxContent>} */
export default {
  name: "Colour Information Box",
  description: "Signals the colour representation used by visual samples.",

  parser(reader) {
    const colour_type = reader.fieldFourCc("colour_type");
    if (colour_type === "nclx") {
      reader.fieldUint("colour_primaries", 2);
      reader.fieldUint("transfer_characteristics", 2);
      reader.fieldUint("matrix_coefficients", 2);
      if (!reader.isFinished()) {
        reader.fieldBits("full_range_flag", 1, [
          { key: "value", bits: 1 },
          { key: "reserved", bits: 7 },
        ]);
      }
    } else if (colour_type === "nclc") {
      reader.fieldUint("colour_primaries", 2);
      reader.fieldUint("transfer_characteristics", 2);
      reader.fieldUint("matrix_coefficients", 2);
    } else if (
      (colour_type === "rICC" || colour_type === "prof") &&
      !reader.isFinished()
    ) {
      reader.fieldHex("ICC_profile", reader.getRemainingLength());
    } else if (!reader.isFinished()) {
      reader.fieldHex("ICC_profile", reader.getRemainingLength());
    }
  },
};
