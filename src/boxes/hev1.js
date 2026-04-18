import { parseVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "HEV1 Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
