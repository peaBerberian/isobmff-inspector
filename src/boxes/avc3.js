import { parseVisualSampleEntry } from "./helpers.js";

export default {
  name: "AVC3 Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
