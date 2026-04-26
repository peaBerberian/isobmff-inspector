/**
 * @typedef {Object} MediaHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {import("../types.js").ParsedDateField} creation_time
 * @property {import("../types.js").ParsedDateField} modification_time
 * @property {number} timescale
 * @property {number|bigint} duration
 * @property {import("../types.js").ParsedBitsField} language
 * @property {number} pre_defined
 */

/** @type {import("./types.js").BoxDefinition<MediaHeaderBoxContent>} */
export default {
  name: "Media Header Box",
  description: "Timing and language metadata for one track's media.",
  parser(r) {
    const version = r.fieldUint("version", 1);
    r.fieldUint("flags", 3);
    r.fieldMacDate("creation_time", version ? 8 : 4);
    r.fieldMacDate("modification_time", version ? 8 : 4);
    r.fieldUint("timescale", 4);
    if (version) {
      r.fieldUint64("duration");
    } else {
      r.fieldUint("duration", 4);
    }

    r.fieldBits("language", 2, [
      { key: "pad", bits: 1 },
      { key: "value", bits: 15 },
    ]);
    r.fieldUint("pre_defined", 2);
  },
};
