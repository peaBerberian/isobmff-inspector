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
    const version = r.fieldUint("version", 1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    r.fieldUint("flags", 3);

    r.fieldUint("reserved", 1);
    if (version === 0) {
      r.addField("reserved_1", r.readUint(1));
    } else {
      const blocks = r.readUint(1);
      const default_crypt_byte_block = (blocks >> 4) & 0x0f;
      const default_skip_byte_block = blocks & 0x0f;
      r.addField("default_crypt_byte_block", default_crypt_byte_block);
      r.addField("default_skip_byte_block", default_skip_byte_block);
      r.addField(
        "default_pattern",
        structField(
          [
            parsedBoxValue("crypt_byte_block", default_crypt_byte_block),
            parsedBoxValue("skip_byte_block", default_skip_byte_block),
            parsedBoxValue("raw", blocks),
          ],
          "cenc-pattern",
        ),
      );
    }

    r.fieldUint("default_IsProtected", 1);
    const default_Per_Sample_IV_Size = r.fieldUint(
      "default_Per_Sample_IV_Size",
      1,
    );
    r.fieldBytes("default_KID", 16);

    if (default_Per_Sample_IV_Size === 0 && !r.isFinished()) {
      const default_constant_IV_size = r.readUint(1);
      r.addField("default_constant_IV_size", default_constant_IV_size);
      r.addField("default_constant_IV", r.readBytes(default_constant_IV_size));
    }
  },
};
