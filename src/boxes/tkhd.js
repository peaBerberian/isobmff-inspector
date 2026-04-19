/**
 * @typedef {Object} TrackHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number|bigint} creation_time
 * @property {number|bigint} modification_time
 * @property {number} track_ID
 * @property {number} reserved_1
 * @property {number|bigint} duration
 * @property {number[]} reserved_2
 * @property {number} layer
 * @property {number} alternate_group
 * @property {string} volume
 * @property {number} reserved_3
 * @property {number[]} matrix
 * @property {number[]} width
 * @property {number[]} height
 */

/** @type {import("../types.js").BoxDefinition<TrackHeaderBoxContent>} */
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
      reserved_1: r.bytesToInt(4),
      duration: version ? r.bytesToUint64BigInt() : r.bytesToInt(4),
      reserved_2: [r.bytesToInt(4), r.bytesToInt(4)],

      // TODO template? signed?
      layer: r.bytesToInt(2),
      alternate_group: r.bytesToInt(2),
      volume: [r.bytesToInt(1), r.bytesToInt(1)].join("."),
      reserved_3: r.bytesToInt(2),
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
