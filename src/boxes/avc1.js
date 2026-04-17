import { parseVisualSampleEntry } from "./helpers.js";

export default {
  name: "AVC Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
