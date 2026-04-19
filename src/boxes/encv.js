import { parseVisualSampleEntry } from "./helpers.js";

/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Encrypted Video Sample Entry",
  description:
    "Describes encrypted visual samples and their protection metadata.",
  container: true,

  parser(r) {
    return parseVisualSampleEntry(r);
  },
};
