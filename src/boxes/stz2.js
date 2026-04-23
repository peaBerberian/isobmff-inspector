import { bitsField } from "../fields.js";

/**
 * @typedef {Object} CompactSampleSizeBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} reserved
 * @property {number} field_size
 * @property {number} sample_count
 * @property {Array<number>} entries
 */

/** @type {import("./types.js").BoxDefinition<CompactSampleSizeBoxContent>} */
export default {
  name: "Compact Sample Size Box",
  description:
    "Stores per-sample sizes using 4-, 8- or 16-bit compact entries.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "stz2 box version");
    if (version !== 0) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3, "stz2 box flags");
    reader.fieldUint("reserved", 3, "Reserved 24 bits");
    const field_size = reader.fieldUint(
      "field_size",
      1,
      "Entry size in bits; should be 4, 8 or 16",
    );
    const sample_count = reader.fieldUint("sample_count", 4);

    /** @type {Array<number>} */
    const entries = [];
    if (field_size === 4) {
      while (entries.length < sample_count) {
        const packed = bitsField(reader.readUint(1), 8, [
          { key: "entry_size_1", bits: 4 },
          { key: "entry_size_2", bits: 4 },
        ]);
        entries.push(packed.fields[0].value);
        if (entries.length < sample_count) {
          entries.push(packed.fields[1].value);
        }
      }
    } else if (field_size === 8 || field_size === 16) {
      const entryBytes = field_size / 8;
      for (let i = 0; i < sample_count; i++) {
        entries.push(reader.readUint(entryBytes));
      }
    } else {
      throw new Error("invalid field_size");
    }
    reader.addField("entries", entries);
  },
};
