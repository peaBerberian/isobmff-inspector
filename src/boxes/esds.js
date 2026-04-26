import { parseDescriptor } from "./helpers.js";

/**
 * @typedef {Object} ElementStreamDescriptorBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {Array<import("./helpers.js").Descriptor>} descriptors
 */

/** @type {import("./types.js").BoxDefinition<ElementStreamDescriptorBoxContent>} */
export default {
  name: "Elementary Stream Descriptor Box",
  description:
    "Carries MPEG-4 elementary stream descriptors for a sample entry.",

  parser(reader) {
    const version = reader.fieldUint("version", 1);
    if (version !== 0) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3);
    const descriptors = [];
    const descriptorsOffset = reader.getCurrentOffset();
    while (!reader.isFinished()) {
      descriptors.push(parseDescriptor(reader));
    }
    reader.addField("descriptors", descriptors, {
      offset: descriptorsOffset,
      byteLength: reader.getCurrentOffset() - descriptorsOffset,
    });
  },
};
