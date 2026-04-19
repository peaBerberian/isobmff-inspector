/**
 * @typedef {Object} DataEntryUrlBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {string} location
 */

/** @type {import("../types.js").BoxDefinition<DataEntryUrlBoxContent>} */
export default {
  name: "Data Entry Url Box",
  description:
    "declare the location(s) of the media data used within the presentation.",
  parser(r) {
    return {
      version: r.bytesToInt(1),
      flags: r.bytesToInt(3),
      location: r.bytesToASCII(r.getRemainingLength()),
    };
  },
};
