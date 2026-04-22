import { parseAudioSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition<import("./helpers.js").AudioSampleEntry>} */
export default {
  name: "Encrypted Audio Sample Entry",
  description:
    "Describes encrypted audio samples and their protection metadata.",
  container: true,

  parser(r) {
    return parseAudioSampleEntry(r);
  },
};
