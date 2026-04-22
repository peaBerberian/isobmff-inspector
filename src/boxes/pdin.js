/**
 * @typedef {Object} ProgressiveDownloadInformationBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} rate
 * @property {number} initial_delay
 */

/** @type {import("./types.js").BoxDefinition<ProgressiveDownloadInformationBoxContent>} */
export default {
  name: "Progressive Download Information Box",
  description:
    "Provides rate and startup-delay hints for progressive download playback.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "pdin box version");
    if (version !== 0) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3, "pdin box flags");
    while (!reader.isFinished()) {
      reader.fieldUint("rate", 4, "download rate in bytes/second");
      reader.fieldUint(
        "initial_delay",
        4,
        "suggested delay to prevent rebuffering",
      );
    }
  },
};
