/**
 * @param {import("../types.js").BufferReader} r
 * @returns {string[]}
 */
function readNullTerminatedStrings(r) {
  const bytes = r.bytesToASCII(r.getRemainingLength());
  return bytes.split("\0").filter((str) => str.length > 0);
}

/**
 * @typedef {Object} DataEntryUrnBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {string=} name
 * @property {string=} location
 */

/** @type {import("../types.js").BoxDefinition<DataEntryUrnBoxContent>} */
export default {
  name: "Data Entry Urn Box",
  description:
    "declare the location(s) of the media data used within the presentation.",
  parser(r) {
    /** @type {DataEntryUrnBoxContent} */
    const ret = {
      version: r.bytesToInt(1),
      flags: r.bytesToInt(3),
    };

    const [name, location] = readNullTerminatedStrings(r);

    if (name !== undefined) {
      ret.name = name;
    }
    if (location !== undefined) {
      ret.location = location;
    }

    return ret;
  },
};
