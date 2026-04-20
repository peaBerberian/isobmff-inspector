import { parseDescriptor } from "./helpers.js";

/**
 * @typedef {Object} InitialObjectDescriptorBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {Array<import("./helpers.js").Descriptor>} descriptors
 */

/** @type {import("../types.js").BoxDefinition<InitialObjectDescriptorBoxContent>} */
export default {
  name: "Initial Object Descriptor Box",
  description: "Container for MPEG-4 object descriptor information.",
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
