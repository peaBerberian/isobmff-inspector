// XXX TODO:
import { parsedBoxValue, structField } from "../fields.js";

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

/** @type {import("./types.js").BoxDefinition<MediaHeaderBoxContent>} */
export default {
  name: "Media Header Box",
  description: "Timing and language metadata for one track's media.",
  parser(r) {
    const version = r.fieldUint("version", 1);
    r.fieldUint("flags", 3);
    r.fieldMacDate("creation_time", version ? 8 : 4);
    r.fieldMacDate("modification_time", version ? 8 : 4);
    r.fieldUint("timescale", 4);
    if (version) {
      r.fieldUint64("duration");
    } else {
      r.fieldUint("duration", 4);
    }

    const baseOffset = r.getCurrentOffset();
    const next2Bytes = r.readUint(2);
    r.addField("pad", (next2Bytes >> 15) & 0x01, {
      offset: baseOffset,
      byteLength: 2,
    });
    const language = [
      String.fromCharCode(((next2Bytes >> 10) & 0x1f) + 0x60),
      String.fromCharCode(((next2Bytes >> 5) & 0x1f) + 0x60),
      String.fromCharCode((next2Bytes & 0x1f) + 0x60),
    ].join("");
    r.addField(
      "language",
      structField(
        [parsedBoxValue("value", language), parsedBoxValue("raw", next2Bytes)],
        "iso-639-2-t",
      ),
      {
        offset: baseOffset,
        byteLength: 2,
      },
    );
    r.fieldUint("pre_defined", 2);
  },
};
