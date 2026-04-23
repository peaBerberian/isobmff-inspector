/**
 * @typedef {Object} HintMediaHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} maxPDUsize
 * @property {number} avgPDUsize
 * @property {number} maxbitrate
 * @property {number} avgbitrate
 * @property {number} reserved
 */

/** @type {import("./types.js").BoxDefinition<HintMediaHeaderBoxContent>} */
export default {
  name: "Hint Media Header Box",
  description:
    "Stores protocol-independent bitrate and packet size information for a hint track.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "hmhd box version");
    if (version !== 0) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3, "hmhd box flags");
    reader.fieldUint("maxPDUsize", 2, "Size in bytes of the largest PDU");
    reader.fieldUint("avgPDUsize", 2, "Average PDU size over the presentation");
    reader.fieldUint(
      "maxbitrate",
      4,
      "Maximum bitrate in bits/second over any one-second window",
    );
    reader.fieldUint(
      "avgbitrate",
      4,
      "Average bitrate in bits/second over the entire presentation",
    );
    reader.fieldUint("reserved", 4, "Reserved 32 bits");
  },
};
