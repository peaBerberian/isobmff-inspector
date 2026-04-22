/** @type {import("../types.js").BoxDefinition<{ version: number, flags: number }>} */
export default {
  name: "Subtitle Media Header Box",
  description:
    "Minimal full box header for subtitle media tracks; version 0 carries no additional payload.",

  parser(reader) {
    reader.fieldUint("version", 1, "Version of that sthd box");
    reader.fieldUint("flags", 3, "Flags for that sthd box");
  },
};
