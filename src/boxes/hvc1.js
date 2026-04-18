import { parseVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "HEVC Sample Entry",
  description: "",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
