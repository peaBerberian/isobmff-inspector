/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Pixel Aspect Ratio Box",
  description: "",

  parser(r) {
    return {
      hSpacing: r.bytesToInt(4),
      vSpacing: r.bytesToInt(4),
    };
  },
};
