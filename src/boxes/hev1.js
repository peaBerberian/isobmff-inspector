import { readVisualSampleEntry } from "./helpers.js";

/** @type {import("./types.js").BoxDefinition<import("./helpers.js").VisualSampleEntry>} */
export default {
  name: "HEV1 Sample Entry",
  description:
    "Describes HEVC samples whose parameter sets may be carried in-band.",
  container: true,

  parser(r) {
    readVisualSampleEntry(r);
  },
};
