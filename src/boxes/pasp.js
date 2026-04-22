/**
 * @typedef {Object} PixelAspectRatioBoxContent
 * @property {number} hSpacing
 * @property {number} vSpacing
 */

/** @type {import("./types.js").BoxDefinition<PixelAspectRatioBoxContent>} */
export default {
  name: "Pixel Aspect Ratio Box",
  description:
    "Specifies the horizontal and vertical spacing that define pixel aspect ratio.",

  parser(r) {
    r.fieldUint("hSpacing", 4, "Relative width of a pixel");
    r.fieldUint("vSpacing", 4, "Relative height of a pixel");
  },
};
