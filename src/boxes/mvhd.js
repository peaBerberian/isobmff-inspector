/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
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
      key: "creationTime",
    },
    {
      name: "modification_time",
      description:
        "Last modification timestamp in seconds since 1904-01-01 UTC.",
      key: "modificationTime",
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
      key: "reserved1",
    },
    {
      name: "reserved 2",
      description: "Reserved 2*32 bits",
      key: "reserved2",
    },
    {
      name: "matrix",
      description: "Transformation matrix used for presentation geometry.",
      key: "matrix",
    },
    {
      name: "pre-defined",
      description: "Pre-defined 32*6 bits.",
      key: "predefined",
    },
    {
      name: "next_track_ID",
      description: "Suggested non-zero track id for the next added track.",
      key: "nextTrackId",
    },
  ],

  parser: (reader) => {
    const version = reader.bytesToInt(1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    const flags = reader.bytesToInt(3);

    let creationTime, modificationTime, timescale, duration;
    if (version === 1) {
      creationTime = reader.bytesToUint64BigInt();
      modificationTime = reader.bytesToUint64BigInt();
      timescale = reader.bytesToInt(4);
      duration = reader.bytesToUint64BigInt();
    } else {
      creationTime = reader.bytesToInt(4);
      modificationTime = reader.bytesToInt(4);
      timescale = reader.bytesToInt(4);
      duration = reader.bytesToInt(4);
    }

    const rate = [reader.bytesToInt(2), reader.bytesToInt(2)].join(".");

    const volume = [reader.bytesToInt(1), reader.bytesToInt(1)].join(".");

    const reserved1 = reader.bytesToInt(2);
    const reserved2 = [reader.bytesToInt(4), reader.bytesToInt(4)];

    const matrixArr = [];
    for (let i = 0; i < 9; i++) {
      matrixArr.push(reader.bytesToInt(4));
    }

    const predefined = [
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
      reader.bytesToInt(4),
    ];

    const nextTrackId = reader.bytesToInt(4);

    return {
      version,
      flags,
      creationTime,
      modificationTime,
      timescale,
      duration,
      rate,
      volume,
      reserved1,
      reserved2,
      matrix: matrixArr,
      predefined,
      nextTrackId,
    };
  },
};
