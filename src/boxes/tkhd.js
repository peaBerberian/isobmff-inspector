import { parseTransformationMatrix } from "./helpers.js";

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

/** @type {import("./types.js").BoxDefinition<TrackHeaderBoxContent>} */
export default {
  name: "Track Header Box",
  description: "Characteristics of a single track.",

  parser(r) {
    const version = r.fieldUint("version", 1);
    r.fieldUint("flags", 3);
    r.fieldMacDate("creation_time", version ? 8 : 4);
    r.fieldMacDate("modification_time", version ? 8 : 4);
    r.fieldUint("track_ID", 4);
    r.fieldUint("reserved_1", 4);
    if (version) {
      r.fieldUint64("duration");
    } else {
      r.fieldUint("duration", 4);
    }

    const reserved2Offset = r.getCurrentOffset();
    r.addField("reserved_2", [r.readUint(4), r.readUint(4)], {
      offset: reserved2Offset,
      byteLength: r.getCurrentOffset() - reserved2Offset,
    });
    r.fieldSignedInt("layer", 2);
    r.fieldSignedInt("alternate_group", 2);
    r.fieldFixedPoint("volume", 2, 8, "8.8");
    r.fieldUint("reserved_3", 2);
    const matrixOffset = r.getCurrentOffset();
    r.addField("matrix", parseTransformationMatrix(r), {
      offset: matrixOffset,
      byteLength: r.getCurrentOffset() - matrixOffset,
    });
    r.fieldFixedPoint("width", 4, 16, "16.16");
    r.fieldFixedPoint("height", 4, 16, "16.16");
  },
};
