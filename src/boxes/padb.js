import { bitsField } from "../fields.js";

/**
 * @typedef {Object} PaddingBitsBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} sample_count
 * @property {Array<PaddingBitsEntry>} entries
 */

/**
 * @typedef {Object} PaddingBitsEntry
 * @property {number} reserved_1
 * @property {number} pad1
 * @property {number} reserved_2
 * @property {number} pad2
 */

/** @type {import("./types.js").BoxDefinition<PaddingBitsBoxContent>} */
export default {
  name: "Padding Bits Box",
  description:
    "Stores trailing padding-bit counts for samples that do not end on byte boundaries.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "padb box version");
    if (version !== 0) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3, "padb box flags");
    const sample_count = reader.fieldUint("sample_count", 4);

    /** @type {Array<PaddingBitsEntry>} */
    const entries = [];
    for (let i = 0; i < Math.ceil(sample_count / 2); i++) {
      const packed = bitsField(reader.readUint(1), 8, [
        { key: "reserved_1", bits: 1 },
        { key: "pad1", bits: 3 },
        { key: "reserved_2", bits: 1 },
        { key: "pad2", bits: 3 },
      ]);
      entries.push({
        reserved_1: packed.fields[0].value,
        pad1: packed.fields[1].value,
        reserved_2: packed.fields[2].value,
        pad2: packed.fields[3].value,
      });
    }
    reader.addField("entries", entries);
  },
};
