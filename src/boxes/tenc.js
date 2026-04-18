/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Track Encryption Box",
  description: "",

  parser(r) {
    const version = r.bytesToInt(1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    const flags = r.bytesToInt(3);
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

    ret.default_isProtected = r.bytesToInt(1);
    ret.default_Per_Sample_IV_Size = r.bytesToInt(1);
    ret.default_KID = r.bytesToHex(16);

    if (ret.default_Per_Sample_IV_Size === 0 && !r.isFinished()) {
      ret.default_constant_IV_size = r.bytesToInt(1);
      ret.default_constant_IV = r.bytesToHex(ret.default_constant_IV_size);
    }

    return ret;
  },
};
