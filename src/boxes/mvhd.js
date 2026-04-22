import { parseTransformationMatrix } from "./helpers.js";

/**
 * @typedef {Object} MovieHeaderBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {import("../types.js").ParsedDateField} creation_time
 * @property {import("../types.js").ParsedDateField} modification_time
 * @property {number} timescale
 * @property {number|bigint} duration
 * @property {import("../types.js").ParsedFixedPointField} rate
 * @property {import("../types.js").ParsedFixedPointField} volume
 * @property {number} reserved_1
 * @property {number[]} reserved_2
 * @property {import("../types.js").ParsedStructField} matrix
 * @property {number[]} pre_defined
 * @property {number} next_track_ID
 */

/** @type {import("./types.js").BoxDefinition<MovieHeaderBoxContent>} */
export default {
  name: "Movie Header Box",
  description:
    "Overall timing and playback defaults for the whole presentation.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "mvhd version");
    if (version > 1) {
      throw new Error("invalid version");
    }

    reader.fieldUint("flags", 3, "mvhd flags");

    if (version === 1) {
      reader.fieldMacDate(
        "creation_time",
        8,
        "Creation timestamp in seconds since 1904-01-01 UTC.",
      );
      reader.fieldMacDate(
        "modification_time",
        8,
        "Last modification timestamp in seconds since 1904-01-01 UTC.",
      );
      reader.fieldUint(
        "timescale",
        4,
        "Number of movie time units per second.",
      );
      reader.fieldUint64("duration", "Movie duration in the movie timescale.");
    } else {
      reader.fieldMacDate(
        "creation_time",
        4,
        "Creation timestamp in seconds since 1904-01-01 UTC.",
      );
      reader.fieldMacDate(
        "modification_time",
        4,
        "Last modification timestamp in seconds since 1904-01-01 UTC.",
      );
      reader.fieldUint(
        "timescale",
        4,
        "Number of movie time units per second.",
      );
      reader.fieldUint("duration", 4, "Movie duration in the movie timescale.");
    }

    reader.fieldSignedFixedPoint(
      "rate",
      4,
      32,
      16,
      "16.16",
      "Preferred playback rate as a 16.16 fixed-point value.",
    );
    reader.fieldFixedPoint(
      "volume",
      2,
      8,
      "8.8",
      "Preferred playback volume as an 8.8 fixed-point value.",
    );
    reader.fieldUint("reserved_1", 2, "Reserved 16 bits");
    reader.addField(
      "reserved_2",
      [reader.readUint(4), reader.readUint(4)],
      "Reserved 2*32 bits",
    );
    reader.addField(
      "matrix",
      parseTransformationMatrix(reader),
      "Transformation matrix used for presentation geometry.",
    );
    reader.addField(
      "pre_defined",
      [
        reader.readUint(4),
        reader.readUint(4),
        reader.readUint(4),
        reader.readUint(4),
        reader.readUint(4),
        reader.readUint(4),
      ],
      "Pre-defined 32*6 bits.",
    );
    reader.fieldUint(
      "next_track_ID",
      4,
      "Suggested non-zero track id for the next added track.",
    );
  },
};
