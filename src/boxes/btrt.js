export default {
  name: "Bit Rate Box",
  description: "",

  parser(r) {
    return {
      bufferSizeDB: r.bytesToInt(4),
      maxBitrate: r.bytesToInt(4),
      avgBitrate: r.bytesToInt(4),
    };
  },
};
