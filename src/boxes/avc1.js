import { parseVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "AVC Sample Entry",
  description:
    "Describes AVC video samples whose parameter sets are stored in this entry.",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
