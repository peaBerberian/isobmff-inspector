/**
 * @typedef {Object} DataReferenceBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 */

/** @type {import("./types.js").BoxDefinition<DataReferenceBoxContent>} */
export default {
  name: "Data Reference Box",
  description: "Lists references that locate the media data used by the track.",
  container: true,

  parser(reader) {
    const version = reader.fieldUint("version", 1);
    const flags = reader.fieldUint("flags", 3);
    if (version !== 0) {
      throw new Error("invalid version");
    }
    if (flags !== 0) {
      throw new Error("invalid flags");
    }
    reader.fieldUint("entry_count", 4);
  },
};
