/**
 * @typedef {Object} DataEntryUrlBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {string} location
 */

/** @type {import("./types.js").BoxDefinition<DataEntryUrlBoxContent>} */
export default {
  name: "Data Entry Url Box",
  description:
    "declare the location(s) of the media data used within the presentation.",
  parser(r) {
    r.fieldUint("version", 1, "url box version");
    r.fieldUint("flags", 3, "url box flags");
    r.fieldNullTerminatedUtf8("location");
  },
};
