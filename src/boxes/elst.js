import { toSignedInt } from "./helpers.js";

/**
 * @typedef {Object} EditListBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} entry_count
 * @property {Array<EditListBoxEntry>} entries
 */

/**
 * @typedef {Object} EditListBoxEntry
 * @property {number|bigint} segment_duration
 * @property {number|bigint} media_time
 * @property {number} media_rate_integer
 * @property {number} media_rate_fraction
 */

/** @type {import("../types.js").BoxDefinition<EditListBoxContent>} */
export default {
  name: "Edit List Box",
  description: "Defines timeline edits that map movie time to media time.",

  parser(reader) {
    const version = reader.fieldUint("version", 1);
    if (version > 1) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3);
    const entry_count = reader.fieldUint("entry_count", 4);

    /** @type Array<EditListBoxEntry> */
    const entries = [];
    for (let i = 0; i < entry_count; i++) {
      entries.push({
        segment_duration:
          version === 0 ? reader.bytesToInt(4) : reader.bytesToUint64BigInt(),
        media_time:
          version === 0 ? ~~reader.bytesToInt(4) : reader.bytesToInt64BigInt(),
        media_rate_integer: toSignedInt(reader.bytesToInt(2), 16),
        media_rate_fraction: reader.bytesToInt(2),
      });
    }
    reader.addField("entries", entries);
  },
};
