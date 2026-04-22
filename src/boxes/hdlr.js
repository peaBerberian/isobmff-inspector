/**
 * @typedef {Object} HandlerReferenceBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} pre_defined
 * @property {number} handler_type
 * @property {[number, number, number]} reserved
 * @property {string} name
 */

/** @type {import("../types.js").BoxDefinition<HandlerReferenceBoxContent>} */
export default {
  name: "Handler Reference Box",
  description:
    "Identifies the handler type for the track or metadata it belongs to.",

  parser(reader) {
    reader.fieldUint("version", 1);
    reader.fieldUint("flags", 3);
    reader.fieldUint("pre_defined", 4);
    reader.fieldUint("handler_type", 4);
    reader.addField("reserved", [
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
    ]);
    reader.fieldAscii("name", reader.getRemainingLength());
  },
};
