import { parseAudioSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "MPEG-4 Audio Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseAudioSampleEntry(r);
  },
};
