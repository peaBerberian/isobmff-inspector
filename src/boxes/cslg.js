/**
 * @typedef {Object} CompositionToDecodeBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number|bigint} compositionToDTSShift
 * @property {number|bigint} leastDecodeToDisplayDelta
 * @property {number|bigint} greatestDecodeToDisplayDelta
 * @property {number|bigint} compositionStartTime
 * @property {number|bigint} compositionEndTime
 */

/** @type {import("./types.js").BoxDefinition<CompositionToDecodeBoxContent>} */
export default {
  name: "Composition To Decode Box",
  description:
    "Provides composition-to-decode timeline offsets used to reconstruct presentation timestamps for re-ordered samples.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "cslg version");
    reader.fieldUint("flags", 3, "cslg flags, generally at 0");
    if (version === 0) {
      reader.fieldSignedInt("compositionToDTSShift", 4);
      reader.fieldSignedInt("leastDecodeToDisplayDelta", 4);
      reader.fieldSignedInt("greatestDecodeToDisplayDelta", 4);
      reader.fieldSignedInt("compositionStartTime", 4);
      reader.fieldSignedInt("compositionEndTime", 4);
    } else if (version === 1) {
      reader.fieldInt64("compositionToDTSShift");
      reader.fieldInt64("leastDecodeToDisplayDelta");
      reader.fieldInt64("greatestDecodeToDisplayDelta");
      reader.fieldInt64("compositionStartTime");
      reader.fieldInt64("compositionEndTime");
    } else {
      throw new Error("invalid version");
    }
  },
};
