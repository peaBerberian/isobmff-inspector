import { readVisualSampleEntry } from "./helpers.js";

/** @type {import("./types.js").BoxDefinition<import("./helpers.js").VisualSampleEntry>} */
export default {
  name: "AVC Sample Entry",
  description:
    "Describes AVC video samples whose parameter sets are stored in this entry.",
  container: true,

  parser(reader) {
    readVisualSampleEntry(reader);
  },
};
