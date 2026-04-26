import { parseAudioSampleEntry } from "./helpers.js";

/** @type {import("./types.js").BoxDefinition<import("./helpers.js").AudioSampleEntry>} */
export default {
  name: "AC-3 Audio Sample Entry",
  description:
    "Describes AC-3 audio samples and their dac3 decoder-specific box.",
  container: true,

  parser(reader) {
    parseAudioSampleEntry(reader);
  },
};
