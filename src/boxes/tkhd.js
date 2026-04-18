/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Track Header Box",
  description: "Characteristics of a single track.",

  parser(r) {
    const version = r.bytesToInt(1);
    return {
      version,
      flags: r.bytesToInt(3),
      creation_time: version ? r.bytesToUint64BigInt() : r.bytesToInt(4),
      modification_time: version ? r.bytesToUint64BigInt() : r.bytesToInt(4),
      track_ID: r.bytesToInt(4),
      reserved1: r.bytesToInt(4),
      duration: version ? r.bytesToUint64BigInt() : r.bytesToInt(4),
      reserved2: [r.bytesToInt(4), r.bytesToInt(4)],

      // TODO template? signed?
      layer: r.bytesToInt(2),
      alternate_group: r.bytesToInt(2),
      volume: [r.bytesToInt(1), r.bytesToInt(1)].join("."),
      reserved3: r.bytesToInt(2),
      matrix: [
        r.bytesToInt(4),
        r.bytesToInt(4),
        r.bytesToInt(4),

        r.bytesToInt(4),
        r.bytesToInt(4),
        r.bytesToInt(4),

        r.bytesToInt(4),
        r.bytesToInt(4),
        r.bytesToInt(4),
      ],
      width: [r.bytesToInt(2), r.bytesToInt(2)],
      height: [r.bytesToInt(2), r.bytesToInt(2)],
    };
  },
};
