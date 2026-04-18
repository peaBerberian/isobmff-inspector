import { parseVisualSampleEntry } from "./helpers.js";

export default {
  name: "Encrypted Video Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
