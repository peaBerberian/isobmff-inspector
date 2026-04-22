/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Video Media Header",
  description:
    "The video media header contains general presentation " +
    "information, independent of the coding, for video media.",

  parser(reader) {
    const version = reader.fieldUint("version", 1);
    const flags = reader.fieldUint("flags", 3);
    if (version !== 0) {
      throw new Error("invalid version");
    }
    if (flags !== 1) {
      reader.addIssue(
        "warning",
        `Unexpected vmhd flags value ${flags}; expected 1.`,
      );
    }

    reader.fieldUint("graphicsmode", 2);
    reader.addField("opcolor", [
      reader.readUint(2),
      reader.readUint(2),
      reader.readUint(2),
    ]);
  },
};
