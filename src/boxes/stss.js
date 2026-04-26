/**
 * @typedef {Object} SyncSampleBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 * @property {Array<number>} sample_numbers
 */

/** @type {import("./types.js").BoxDefinition<SyncSampleBoxContent>} */
export default {
  name: "Sync Sample Box",
  description: "Lists samples that can be used as random access points.",

  parser(r) {
    const version = r.fieldUint("version", 1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    r.fieldUint("flags", 3);
    const entry_count = r.fieldUint("entry_count", 4);
    const sample_numbers = [];
    const sampleNumbersOffset = r.getCurrentOffset();

    for (let i = 0; i < entry_count; i++) {
      sample_numbers.push(r.readUint(4));
    }
    r.addField("sample_numbers", sample_numbers, {
      offset: sampleNumbersOffset,
      byteLength: r.getCurrentOffset() - sampleNumbersOffset,
    });
  },
};
