/**
 * @typedef {Object} DegradationPriorityBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {Array<number>} priorities
 * @property {Uint8Array=} trailing_bytes
 */

/** @type {import("./types.js").BoxDefinition<DegradationPriorityBoxContent>} */
export default {
  name: "Degradation Priority Box",
  description:
    "Stores one degradation-priority value for each sample in the sample table.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "stdp box version");
    if (version !== 0) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3, "stdp box flags");

    /** @type {Array<number>} */
    const priorities = [];
    const prioritiesOffset = reader.getCurrentOffset();
    while (reader.getRemainingLength() >= 2) {
      priorities.push(reader.readUint(2));
    }
    reader.addField("priorities", priorities, {
      offset: prioritiesOffset,
      byteLength: reader.getCurrentOffset() - prioritiesOffset,
    });

    if (!reader.isFinished()) {
      reader.fieldBytes("trailing_bytes", reader.getRemainingLength());
    }
  },
};
