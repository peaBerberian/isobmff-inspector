/** @type {import("./types.js").BoxDefinition<{ version: number, flags: number, reference_track_id: number, ntp_timestamp: bigint, media_time: number | bigint }>} */
export default {
  name: "Producer Reference Time Box",
  description:
    "Maps a media decode time to an NTP wall-clock timestamp for low-latency and monitoring workflows.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "prft box version");
    reader.fieldUint("flags", 3, "prft box flags. Should be `0`");
    reader.fieldUint(
      "reference_track_id",
      4,
      "Track ID of the concerned track",
    );
    reader.fieldUint64("ntp_timestamp", "UTC time to compare with media_time");
    if (version === 0) {
      reader.fieldUint(
        "media_time",
        4,
        "Corresponding media time in that track's time unit",
      );
    } else {
      reader.fieldUint64(
        "media_time",
        "Corresponding media time in that track's time unit",
      );
    }
  },
};
