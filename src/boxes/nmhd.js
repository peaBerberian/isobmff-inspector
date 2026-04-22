/** @type {import("./types.js").BoxDefinition<{ version: number, flags: number }>} */
export default {
  name: "Null Media Header Box",
  description:
    "Placeholder media header used for timed metadata and other media types without extra header fields.",

  parser(reader) {
    reader.fieldUint("version", 1);
    reader.fieldUint("flags", 3);
  },
};
