import { parsedBoxValue, structField } from "../fields.js";

/**
 * @typedef {Object} TrackEncryptionBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} reserved
 * @property {number=} reserved_1
 * @property {import("../types.js").ParsedStructField=} default_pattern
 * @property {number=} default_crypt_byte_block
 * @property {number=} default_skip_byte_block
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
    // TODO: To new reader API
    const version = r.readUint(1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    const flags = r.readUint(3);
    /** @type {Partial<TrackEncryptionBoxContent>} */
    const ret = {
      version,
      flags,
    };

    ret.reserved = r.readUint(1);
    if (version === 0) {
      ret.reserved_1 = r.readUint(1);
    } else {
      const blocks = r.readUint(1);
      ret.default_crypt_byte_block = (blocks >> 4) & 0x0f;
      ret.default_skip_byte_block = blocks & 0x0f;
      ret.default_pattern = structField(
        [
          parsedBoxValue("crypt_byte_block", ret.default_crypt_byte_block),
          parsedBoxValue("skip_byte_block", ret.default_skip_byte_block),
          parsedBoxValue("raw", blocks),
        ],
        "cenc-pattern",
      );
    }

    ret.default_IsProtected = r.readUint(1);
    ret.default_Per_Sample_IV_Size = r.readUint(1);
    ret.default_KID = r.readBytes(16);

    if (ret.default_Per_Sample_IV_Size === 0 && !r.isFinished()) {
      const default_constant_IV_size = r.readUint(1);
      ret.default_constant_IV_size = default_constant_IV_size;
      ret.default_constant_IV = r.readBytes(default_constant_IV_size);
    }

    return /** @type {TrackEncryptionBoxContent} */ (ret);
  },
};
