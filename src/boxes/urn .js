/**
 * @typedef {Object} DataEntryUrnBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {string=} name
 * @property {string=} location
 */

/** @type {import("./types.js").BoxDefinition<DataEntryUrnBoxContent>} */
export default {
  name: "Data Entry Urn Box",
  description:
    "declare the location(s) of the media data used within the presentation.",
  parser(r) {
    r.fieldUint("version", 1, "urn box version");
    r.fieldUint("flags", 3, "urn box flags");
    r.fieldNullTerminatedUtf8("name");
    r.fieldNullTerminatedUtf8("location");
  },
};
