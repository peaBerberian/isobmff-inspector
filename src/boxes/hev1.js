import { parseVisualSampleEntry } from "./helpers.js";

export default {
  name: "HEV1 Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
