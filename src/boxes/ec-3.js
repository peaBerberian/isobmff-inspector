import { parseAudioSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition<import("./helpers.js").AudioSampleEntry>} */
export default {
  name: "EC-3 Audio Sample Entry",
  description:
    "Describes EC-3 audio samples and their dec3 decoder-specific box.",
  container: true,

  parser(reader) {
    return parseAudioSampleEntry(reader);
  },
};
