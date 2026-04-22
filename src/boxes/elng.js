/** @type {import("./types.js").BoxDefinition<{ version: number, flags: number, extended_language: string }>} */
export default {
  name: "Extended Language Box",
  description:
    "Stores an extended BCP-47 language tag when the mdhd 15-bit language code is insufficient.",

  parser(reader) {
    reader.fieldUint("version", 1);
    reader.fieldUint("flags", 3);
    reader.fieldNullTerminatedAscii("extended_language");
  },
};
