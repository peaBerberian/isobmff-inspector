import { parseVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "AVC3 Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
