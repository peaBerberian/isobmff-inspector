import { macDateField, parsedBoxValue, structField } from "../fields.js";

/**
 * @typedef {Object} MediaHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {import("../types.js").ParsedDateField} creation_time
 * @property {import("../types.js").ParsedDateField} modification_time
 * @property {number} timescale
 * @property {number|bigint} duration
 * @property {number} pad
 * @property {import("../types.js").ParsedStructField} language
 * @property {number} pre_defined
 */

/** @type {import("../types.js").BoxDefinition<MediaHeaderBoxContent>} */
export default {
  name: "Media Header Box",
  description: "Timing and language metadata for one track's media.",
  parser(r) {
    // TODO: To new reader API
    const version = r.bytesToInt(1);
    const flags = r.bytesToInt(3);
    const creation_time = version ? r.bytesToUint64BigInt() : r.bytesToInt(4);
    const modification_time = version
      ? r.bytesToUint64BigInt()
      : r.bytesToInt(4);
    const timescale = r.bytesToInt(4);
    const duration = version ? r.bytesToUint64BigInt() : r.bytesToInt(4);

    const next2Bytes = r.bytesToInt(2);
    const pad = (next2Bytes >> 15) & 0x01;
    const language = [
      String.fromCharCode(((next2Bytes >> 10) & 0x1f) + 0x60),
      String.fromCharCode(((next2Bytes >> 5) & 0x1f) + 0x60),
      String.fromCharCode((next2Bytes & 0x1f) + 0x60),
    ].join("");
    const pre_defined = r.bytesToInt(2);
    return {
      version,
      flags,
      creation_time: macDateField(creation_time),
      modification_time: macDateField(modification_time),
      timescale,
      duration,
      pad,
      language: structField(
        [parsedBoxValue("value", language), parsedBoxValue("raw", next2Bytes)],
        "iso-639-2-t",
      ),
      pre_defined,
    };
  },
};
