import { toSignedInt } from "./helpers.js";

/**
 * @typedef {Object} SoundMediaHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} balance
 * @property {number} reserved
 */

/** @type {import("./types.js").BoxDefinition<SoundMediaHeaderBoxContent>} */
export default {
  name: "Sound Media Header Box",
  description: "Stores audio presentation information for a sound track.",

  parser(r) {
    const version = r.fieldUint("version", 1);
    if (version !== 0) {
      throw new Error("invalid version");
    }
    r.fieldUint("flags", 3);
    r.addField("balance", toSignedInt(r.readUint(2), 16) / 256);
    r.fieldUint("reserved", 2);
  },
};
