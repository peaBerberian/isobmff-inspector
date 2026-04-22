import { toSignedInt } from "./helpers.js";

/**
 * @typedef {Object} SoundMediaHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} balance
 * @property {number} reserved
 */

/** @type {import("../types.js").BoxDefinition<SoundMediaHeaderBoxContent>} */
export default {
  name: "Sound Media Header Box",
  description: "Stores audio presentation information for a sound track.",

  parser(r) {
    // TODO: To new reader API
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
