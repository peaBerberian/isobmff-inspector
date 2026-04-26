/**
 * @typedef {Object} TrackEncryptionBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} reserved
 * @property {number=} reserved_1
 * @property {import("../types.js").ParsedBitsField=} default_pattern
 * @property {number} default_IsProtected
 * @property {number} default_Per_Sample_IV_Size
 * @property {Uint8Array} default_KID
 * @property {number=} default_constant_IV_size
 * @property {Uint8Array=} default_constant_IV
 */

/** @type {import("./types.js").BoxDefinition<TrackEncryptionBoxContent>} */
export default {
  name: "Track Encryption Box",
  description:
    "Defines default encryption parameters for samples in a protected track.",

  parser(r) {
    const version = r.fieldUint("version", 1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    r.fieldUint("flags", 3);

    r.fieldUint("reserved", 1);
    if (version === 0) {
      r.fieldUint("reserved_1", 1);
    } else {
      r.fieldBits("default_pattern", 1, [
        { key: "crypt_byte_block", bits: 4 },
        { key: "skip_byte_block", bits: 4 },
      ]);
    }

    r.fieldUint("default_IsProtected", 1);
    const default_Per_Sample_IV_Size = r.fieldUint(
      "default_Per_Sample_IV_Size",
      1,
    );
    r.fieldBytes("default_KID", 16);

    if (default_Per_Sample_IV_Size === 0 && !r.isFinished()) {
      const default_constant_IV_size = r.fieldUint(
        "default_constant_IV_size",
        1,
      );
      r.fieldBytes("default_constant_IV", default_constant_IV_size);
    }
  },
};
