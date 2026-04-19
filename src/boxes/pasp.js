/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Pixel Aspect Ratio Box",
  description:
    "Specifies the horizontal and vertical spacing that define pixel aspect ratio.",

  parser(r) {
    return {
      hSpacing: r.bytesToInt(4),
      vSpacing: r.bytesToInt(4),
    };
  },
};
