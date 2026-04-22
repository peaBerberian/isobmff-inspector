/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Scheme Type Box",
  description:
    "Identifies the protection or restriction scheme and its version.",

  parser(r) {
    const version = r.fieldUint("version", 1, "schm box version, should be 0.");
    if (version !== 0) {
      throw new Error("invalid version");
    }
    const flags = r.fieldUint("flags", 3, "schm box flags");
    r.fieldFourCc(
      "scheme_type",
      "Code linked to the protection/restriction scheme",
    );
    r.fieldUint("scheme_version", 4, "Version of the scheme");
    if (flags & 0x000001) {
      r.fieldNullTerminatedUtf8("scheme_uri");
    }
  },
};
