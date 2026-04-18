/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Original Format Box",
  description: "",

  parser(r) {
    return {
      original_format: r.bytesToASCII(4),
    };
  },
};
