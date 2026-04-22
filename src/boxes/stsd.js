/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample Description",
  description: "Information about the coding type used",

  parser(r) {
    r.fieldUint("version", 1, "stsd box version");
    r.fieldUint("flags", 3, "stsd box flags");
    r.fieldUint("entry_count", 4, "Number of entries inside that box");
  },
  container: true,
};
