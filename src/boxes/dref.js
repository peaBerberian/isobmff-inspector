/**
 * @typedef {Object} DataReferenceBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 */

/** @type {import("../types.js").BoxDefinition<DataReferenceBoxContent>} */
export default {
  name: "Data Reference Box",
  description: "Lists references that locate the media data used by the track.",
  container: true,

  parser(reader) {
    const version = reader.bytesToInt(1);
    const flags = reader.bytesToInt(3);
    if (version !== 0) {
      throw new Error("invalid version");
    }
    if (flags !== 0) {
      throw new Error("invalid flags");
    }
    const entry_count = reader.bytesToInt(4);
    return { version, flags, entry_count };
  },
};
