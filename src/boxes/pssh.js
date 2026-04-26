/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Protection System Specific Header",
  description:
    "Carries DRM system identifiers and system-specific protection data.",
  parser(reader) {
    const version = reader.fieldUint("version", 1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    reader.fieldUint("flags", 3);
    reader.fieldBytes("systemID", 16, "DRM system identifier");
    if (version === 1) {
      const KID_count = reader.fieldUint("KID_count", 4);

      /** @type {Array<Uint8Array>} */
      const KIDs = [];
      for (let i = 0; i < KID_count; i++) {
        KIDs.push(reader.readBytes(16));
      }
      reader.addField("KIDs", KIDs);
    }

    const data_length = reader.fieldUint("data_length", 4);
    reader.addField("data", reader.readBytes(data_length));
  },
};
