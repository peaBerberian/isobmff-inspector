import { parseVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "HEV1 Sample Entry",
  description:
    "Describes HEVC samples whose parameter sets may be carried in-band.",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
