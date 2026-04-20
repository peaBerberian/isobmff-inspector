import { fixedPointField, macDateField } from "../fields.js";
import { parseTransformationMatrix, toSignedInt } from "./helpers.js";

/**
 * @typedef {Object} TrackHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {import("../types.js").ParsedDateField} creation_time
 * @property {import("../types.js").ParsedDateField} modification_time
 * @property {number} track_ID
 * @property {number} reserved_1
 * @property {number|bigint} duration
 * @property {number[]} reserved_2
 * @property {number} layer
 * @property {number} alternate_group
 * @property {import("../types.js").ParsedFixedPointField} volume
 * @property {number} reserved_3
 * @property {import("../types.js").ParsedStructField} matrix
 * @property {import("../types.js").ParsedFixedPointField} width
 * @property {import("../types.js").ParsedFixedPointField} height
 */

/** @type {import("../types.js").BoxDefinition<TrackHeaderBoxContent>} */
export default {
  name: "Track Header Box",
  description: "Characteristics of a single track.",

  parser(r) {
    const version = r.bytesToInt(1);
    const flags = r.bytesToInt(3);
    const creation_time = version ? r.bytesToUint64BigInt() : r.bytesToInt(4);
    const modification_time = version
      ? r.bytesToUint64BigInt()
      : r.bytesToInt(4);
    return {
      version,
      flags,
      creation_time: macDateField(creation_time),
      modification_time: macDateField(modification_time),
      track_ID: r.bytesToInt(4),
      reserved_1: r.bytesToInt(4),
      duration: version ? r.bytesToUint64BigInt() : r.bytesToInt(4),
      reserved_2: [r.bytesToInt(4), r.bytesToInt(4)],

      layer: toSignedInt(r.bytesToInt(2), 16),
      alternate_group: toSignedInt(r.bytesToInt(2), 16),
      volume: fixedPointField(r.bytesToInt(2), 16, 8, "8.8"),
      reserved_3: r.bytesToInt(2),
      matrix: parseTransformationMatrix(r),
      width: fixedPointField(r.bytesToInt(4), 32, 16, "16.16"),
      height: fixedPointField(r.bytesToInt(4), 32, 16, "16.16"),
    };
  },
};
