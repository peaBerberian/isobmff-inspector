/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Protection System Specific Header",
  description:
    "Carries DRM system identifiers and system-specific protection data.",
  parser(reader) {
    // TODO: To new reader API
    /** @type Partial<Record<string, unknown>> */
    const ret = {};
    const version = reader.readUint(1);
    ret.version = version;
    if (version > 1) {
      throw new Error("invalid version");
    }

    ret.flags = reader.readUint(3);
    const systemID = reader.readBytes(16);
    ret.systemID = systemID;
    if (ret.version === 1) {
      const KID_count = reader.readUint(4);
      ret.KID_count = KID_count;

      /** @type {Array<Uint8Array>} */
      const KIDs = [];
      ret.KIDs = KIDs;

      let i = KID_count;
      while (i--) {
        KIDs.push(reader.readBytes(16));
      }
    }

    const data_length = reader.readUint(4);
    ret.data_length = data_length;
    ret.data = reader.readBytes(data_length);
    return ret;
  },
};
