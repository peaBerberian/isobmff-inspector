/**
 * @typedef {Object} TrackEncryptionBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} reserved
 * @property {number=} reserved_1
 * @property {number=} default_crypt_byte_block
 * @property {number=} default_skip_byte_block
 * @property {number} default_IsProtected
 * @property {number} default_Per_Sample_IV_Size
 * @property {string} default_KID
 * @property {number=} default_constant_IV_size
 * @property {string=} default_constant_IV
 */

/** @type {import("../types.js").BoxDefinition<TrackEncryptionBoxContent>} */
export default {
  name: "Track Encryption Box",
  description:
    "Defines default encryption parameters for samples in a protected track.",

  parser(r) {
    const version = r.bytesToInt(1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    const flags = r.bytesToInt(3);
    /** @type {Partial<TrackEncryptionBoxContent>} */
    const ret = {
      version,
      flags,
    };

    ret.reserved = r.bytesToInt(1);
    if (version === 0) {
      ret.reserved_1 = r.bytesToInt(1);
    } else {
      const blocks = r.bytesToInt(1);
      ret.default_crypt_byte_block = (blocks >> 4) & 0x0f;
      ret.default_skip_byte_block = blocks & 0x0f;
    }

    ret.default_IsProtected = r.bytesToInt(1);
    ret.default_Per_Sample_IV_Size = r.bytesToInt(1);
    ret.default_KID = r.bytesToHex(16);

    if (ret.default_Per_Sample_IV_Size === 0 && !r.isFinished()) {
      const default_constant_IV_size = r.bytesToInt(1);
      ret.default_constant_IV_size = default_constant_IV_size;
      ret.default_constant_IV = r.bytesToHex(default_constant_IV_size);
    }

    return /** @type {TrackEncryptionBoxContent} */ (ret);
  },
};
