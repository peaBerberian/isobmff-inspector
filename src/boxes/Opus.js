import { parseAudioSampleEntry } from "./helpers.js";

/** @type {import("./types.js").BoxDefinition<import("./helpers.js").AudioSampleEntry>} */
export default {
  name: "Opus Sample Entry",
  description:
    "Describes Opus audio samples and their dOps decoder configuration.",
  container: true,

  parser(reader) {
    parseAudioSampleEntry(reader);
  },
};
