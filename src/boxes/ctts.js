/**
 * @typedef {Object} CompositionTimeToSampleBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 * @property {Array<CompositionTimeToSampleBoxEntry>} entries
 */

/**
 * @typedef {Object} CompositionTimeToSampleBoxEntry
 * @property {number} sample_count
 * @property {number} sample_offset
 */

/** @type {import("../types.js").BoxDefinition<CompositionTimeToSampleBoxContent>} */
export default {
  name: "Composition Time to Sample Box",
  description:
    "Maps samples to composition-time offsets for presentation order.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "This box's version.");
    if (version > 1) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3);
    const entry_count = reader.fieldUint(
      "entry_count",
      4,
      "Number of entries in that box",
    );
    const entries = [];
    for (let i = 0; i < entry_count; i++) {
      entries.push({
        sample_count: reader.bytesToInt(4),
        sample_offset:
          version === 0 ? reader.bytesToInt(4) : ~~reader.bytesToInt(4),
      });
    }
    reader.addField("entries", entries);
  },
};
