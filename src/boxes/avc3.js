import { parseVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "AVC3 Sample Entry",
  description:
    "Describes AVC video samples whose parameter sets may be carried in-band.",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
