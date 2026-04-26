/**
 * @typedef {Object} AC3SpecificBoxContent
 * @property {import("../types.js").ParsedBitsField} ac3_config
 */

/** @type {import("./types.js").BoxDefinition<AC3SpecificBoxContent>} */
export default {
  name: "AC-3 Specific Box",
  description:
    "Packed AC-3 decoder configuration carrying stream identification, channel mode, LFE presence and bitrate code.",

  parser(reader) {
    reader.fieldBits("ac3_config", 3, [
      { key: "fscod", bits: 2 },
      { key: "bsid", bits: 5 },
      { key: "bsmod", bits: 3 },
      { key: "acmod", bits: 3 },
      { key: "lfeon", bits: 1 },
      { key: "bit_rate_code", bits: 5 },
      { key: "reserved", bits: 5 },
    ]);
  },
};
