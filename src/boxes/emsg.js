/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Event Message Box",
  description:
    "Carries in-band DASH or CMAF event messages associated with a media timeline.",

  parser(reader) {
    // Taken from DASH edition 5
    const version = reader.fieldUint("version", 1);
    reader.fieldUint("flags", 3);

    if (version === 0) {
      reader.fieldNullTerminatedUtf8("scheme_id_uri");
      reader.fieldNullTerminatedUtf8("value");
      reader.fieldUint("timescale", 4);
      reader.fieldUint("presentation_time_delta", 4);
      reader.fieldUint("event_duration", 4);
      reader.fieldUint("event_id", 4);
    } else if (version === 1) {
      reader.fieldUint("timescale", 4);
      reader.fieldUint64("presentation_time");
      reader.fieldUint("event_duration", 4);
      reader.fieldUint("event_id", 4);
      reader.fieldNullTerminatedUtf8("scheme_id_uri");
      reader.fieldNullTerminatedUtf8("value");
    } else {
      throw new Error("invalid version");
    }

    if (!reader.isFinished()) {
      reader.fieldBytes("message_data", reader.getRemainingLength());
    }
  },
};
