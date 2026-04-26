/**
 * @param {number} code
 * @returns {string}
 */
function decodeIso639Language(code) {
  return String.fromCharCode(
    ((code >> 10) & 0x1f) + 0x60,
    ((code >> 5) & 0x1f) + 0x60,
    (code & 0x1f) + 0x60,
  );
}

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "ID3 Metadata Box",
  description: "Carries ID3 metadata with a language code and raw ID3 payload.",

  parser(r) {
    r.fieldUint("version", 1, "id32 box version");
    r.fieldUint("flags", 3, "id32 box flags");
    const baseOffset = r.getCurrentOffset();
    r.addField("languageCode", decodeIso639Language(r.readUint(2)), {
      offset: baseOffset,
      byteLength: 2,
    });
    r.fieldBytes("data", r.getRemainingLength());
  },
};
