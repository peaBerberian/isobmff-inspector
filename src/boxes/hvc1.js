import { parseVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition<import("./helpers.js").VisualSampleEntry>} */
export default {
  name: "HEVC Sample Entry",
  description:
    "Describes HEVC samples whose parameter sets are stored in this entry.",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
