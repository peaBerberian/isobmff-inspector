/**
 * @typedef {Object} ShadowSyncSampleBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 * @property {Array<ShadowSyncSampleEntry>} entries
 */

/**
 * @typedef {Object} ShadowSyncSampleEntry
 * @property {number} shadowed_sample_number
 * @property {number} sync_sample_number
 */

/** @type {import("./types.js").BoxDefinition<ShadowSyncSampleBoxContent>} */
export default {
  name: "Shadow Sync Sample Box",
  description:
    "Maps non-sync samples to alternate sync samples that may be used for seeking.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "stsh box version");
    if (version !== 0) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3, "stsh box flags");
    const entry_count = reader.fieldUint("entry_count", 4);

    /** @type {Array<ShadowSyncSampleEntry>} */
    const entries = [];
    const entriesOffset = reader.getCurrentOffset();
    for (let i = 0; i < entry_count; i++) {
      entries.push({
        shadowed_sample_number: reader.readUint(4),
        sync_sample_number: reader.readUint(4),
      });
    }
    reader.addField("entries", entries, {
      offset: entriesOffset,
      byteLength: reader.getCurrentOffset() - entriesOffset,
    });
  },
};
