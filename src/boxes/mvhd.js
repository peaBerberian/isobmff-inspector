import {
  fixedPointField,
  macDateField,
  signedFixedPointField,
} from "../fields.js";
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

/** @type {import("../types.js").BoxDefinition<MovieHeaderBoxContent>} */
export default {
  name: "Movie Header Box",
  description:
    "Overall timing and playback defaults for the whole presentation.",
  content: [
    {
      name: "version",
      description: "mvhd version",
      key: "version",
    },
    {
      name: "flags",
      description: "mvhd flags",
      key: "flags",
    },
    {
      name: "creation_time",
      description: "Creation timestamp in seconds since 1904-01-01 UTC.",
      key: "creation_time",
    },
    {
      name: "modification_time",
      description:
        "Last modification timestamp in seconds since 1904-01-01 UTC.",
      key: "modification_time",
    },
    {
      name: "timescale",
      description: "Number of movie time units per second.",
      key: "timescale",
    },
    {
      name: "duration",
      description: "Movie duration in the movie timescale.",
      key: "duration",
    },
    {
      name: "rate",
      description: "Preferred playback rate as a 16.16 fixed-point value.",
      key: "rate",
    },
    {
      name: "volume",
      description: "Preferred playback volume as an 8.8 fixed-point value.",
      key: "volume",
    },
    {
      name: "reserved 1",
      description: "Reserved 16 bits",
      key: "reserved_1",
    },
    {
      name: "reserved 2",
      description: "Reserved 2*32 bits",
      key: "reserved_2",
    },
    {
      name: "matrix",
      description: "Transformation matrix used for presentation geometry.",
      key: "matrix",
    },
    {
      name: "pre-defined",
      description: "Pre-defined 32*6 bits.",
      key: "pre_defined",
    },
    {
      name: "next_track_ID",
      description: "Suggested non-zero track id for the next added track.",
      key: "next_track_ID",
    },
  ],

  parser: (reader) => {
    const version = reader.bytesToInt(1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    const flags = reader.bytesToInt(3);

    let creation_time, modification_time, timescale, duration;
    if (version === 1) {
      creation_time = reader.bytesToUint64BigInt();
      modification_time = reader.bytesToUint64BigInt();
      timescale = reader.bytesToInt(4);
      duration = reader.bytesToUint64BigInt();
    } else {
      creation_time = reader.bytesToInt(4);
      modification_time = reader.bytesToInt(4);
      timescale = reader.bytesToInt(4);
      duration = reader.bytesToInt(4);
    }

    const rate = signedFixedPointField(reader.bytesToInt(4), 32, 16, "16.16");

    const volume = fixedPointField(reader.bytesToInt(2), 8, "8.8");

    const reserved_1 = reader.bytesToInt(2);
    const reserved_2 = [reader.bytesToInt(4), reader.bytesToInt(4)];

    const matrix = parseTransformationMatrix(reader);

    const pre_defined = [
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
    ];

    const next_track_ID = reader.bytesToInt(4);

    return {
      version,
      flags,
      creation_time: macDateField(creation_time),
      modification_time: macDateField(modification_time),
      timescale,
      duration,
      rate,
      volume,
      reserved_1,
      reserved_2,
      matrix,
      pre_defined,
      next_track_ID,
    };
  },
};
