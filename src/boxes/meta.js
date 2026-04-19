/**
 * @typedef {Object} MetadataBoxContent
 * @property {number} version
 * @property {number} flags
 */

/** @type {import("../types.js").BoxDefinition<MetadataBoxContent>} */
export default {
  name: "Metadata Box",
  description: "Container for metadata boxes and their handler.",
  container: true,

  parser(r) {
    const version = r.bytesToInt(1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    return {
      version,
      flags: r.bytesToInt(3),
    };
  },
};
