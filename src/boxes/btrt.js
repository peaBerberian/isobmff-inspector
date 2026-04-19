/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Bit Rate Box",
  description: "Provides buffer size and bitrate limits for a sample entry.",

  parser(r) {
    return {
      bufferSizeDB: r.bytesToInt(4),
      maxBitrate: r.bytesToInt(4),
      avgBitrate: r.bytesToInt(4),
    };
  },
};
