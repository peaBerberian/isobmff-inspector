import { toSignedInt } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Sound Media Header Box",
  description: "",

  parser(r) {
    const version = r.bytesToInt(1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    return {
      version,
      flags: r.bytesToInt(3),
      balance: toSignedInt(r.bytesToInt(2), 16) / 256,
      reserved: r.bytesToInt(2),
    };
  },
};
