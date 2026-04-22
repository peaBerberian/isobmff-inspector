/**
 * @typedef {Object} SyncSampleBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 * @property {Array<number>} sample_numbers
 */

/** @type {import("../types.js").BoxDefinition<SyncSampleBoxContent>} */
export default {
  name: "Sync Sample Box",
  description: "Lists samples that can be used as random access points.",

  parser(r) {
    // TODO: To new reader API
    const version = r.bytesToInt(1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    const flags = r.bytesToInt(3);
    const entry_count = r.bytesToInt(4);
    const sample_numbers = [];

    for (let i = 0; i < entry_count; i++) {
      sample_numbers.push(r.bytesToInt(4));
    }

    return {
      version,
      flags,
      entry_count,
      sample_numbers,
    };
  },
};
