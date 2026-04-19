import { parseDescriptor } from "./helpers.js";

/**
 * @typedef {Object} ElementStreamDescriptorBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {Array<import("./helpers.js").Descriptor>} descriptors
 */

/** @type {import("../types.js").BoxDefinition<ElementStreamDescriptorBoxContent>} */
export default {
  name: "Elementary Stream Descriptor Box",
  description:
    "Carries MPEG-4 elementary stream descriptors for a sample entry.",

  parser(r) {
    const version = r.bytesToInt(1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    const flags = r.bytesToInt(3);
    const descriptors = [];

    while (!r.isFinished()) {
      descriptors.push(parseDescriptor(r));
    }

    return {
      version,
      flags,
      descriptors,
    };
  },
};
