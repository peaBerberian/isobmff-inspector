import { readVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition<import("./helpers.js").VisualSampleEntry>} */
export default {
  name: "AV1 Sample Entry",
  description:
    "Describes AV1 video samples and carries child decoder configuration boxes such as av1C.",
  container: true,

  parser(reader) {
    readVisualSampleEntry(reader);
  },
};
