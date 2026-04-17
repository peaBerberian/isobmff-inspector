import { parseVisualSampleEntry } from "./helpers.js";

export default {
  name: "HEVC Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
