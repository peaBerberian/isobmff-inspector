/**
 * @typedef {Object} HandlerReferenceBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} pre_defined
 * @property {string|number} handler_type
 * @property {[number, number, number]} reserved
 * @property {string} name
 */

/** @type {import("./types.js").BoxDefinition<HandlerReferenceBoxContent>} */
export default {
  name: "Handler Reference Box",
  description:
    "Identifies the handler type for the track or metadata it belongs to.",

  parser(reader) {
    reader.fieldUint("version", 1);
    reader.fieldUint("flags", 3);
    reader.fieldUint("pre_defined", 4);
    reader.fieldFourCc("handler_type");
    const reservedOffset = reader.getCurrentOffset();
    /** @type {[number, number, number]} */
    const reserved = [
      reader.readUint(4),
      reader.readUint(4),
      reader.readUint(4),
    ];
    reader.addField("reserved", reserved, {
      offset: reservedOffset,
      byteLength: reader.getCurrentOffset() - reservedOffset,
    });
    reader.fieldNullTerminatedUtf8("name");
  },
};
