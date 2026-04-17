import { parseDescriptor } from "./helpers.js";

export default {
  name: "Elementary Stream Descriptor Box",
  description: "",

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
