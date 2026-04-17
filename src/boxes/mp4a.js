import { parseAudioSampleEntry } from "./helpers.js";

export default {
  name: "MPEG-4 Audio Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseAudioSampleEntry(r);
  },
};
