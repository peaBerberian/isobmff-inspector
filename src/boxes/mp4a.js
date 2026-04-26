import { parseAudioSampleEntry } from "./helpers.js";

/** @type {import("./types.js").BoxDefinition<import("./helpers.js").AudioSampleEntry>} */
export default {
  name: "MPEG-4 Audio Sample Entry",
  description:
    "Describes MPEG-4 audio samples and their decoder configuration.",
  container: true,

  parser(r) {
    parseAudioSampleEntry(r);
  },
};
