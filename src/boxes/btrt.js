/**
 * @typedef {Object} BitRateBoxContent
 * @property {number} bufferSizeDB
 * @property {number} maxBitrate
 * @property {number} avgBitrate
 */

/** @type {import("./types.js").BoxDefinition<BitRateBoxContent>} */
export default {
  name: "Bit Rate Box",
  description: "Provides buffer size and bitrate limits for a sample entry.",

  parser(reader) {
    reader.fieldUint("bufferSizeDB", 4);
    reader.fieldUint("maxBitrate", 4);
    reader.fieldUint("avgBitrate", 4);
  },
};
