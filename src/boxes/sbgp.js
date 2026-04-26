import { parsedBoxValue, structField } from "../fields.js";

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample To Group Box",
  description:
    "Maps consecutive sample runs to sample-group description indices such as rap, sync or seig entries.",

  parser(reader) {
    const version = reader.fieldUint("version", 1);
    reader.fieldUint("flags", 3);
    reader.fieldFourCc("grouping_type");

    if (version === 1) {
      reader.fieldUint("grouping_type_parameter", 4);
    }

    const entry_count = reader.fieldUint("entry_count", 4);

    /** @type {import("../types.js").ParsedStructField[]} */
    const entries = [];
    const entriesOffset = reader.getCurrentOffset();
    for (let i = 0; i < entry_count && !reader.isFinished(); i++) {
      entries.push(
        structField([
          parsedBoxValue("sample_count", reader.readUint(4)),
          parsedBoxValue("group_description_index", reader.readUint(4)),
        ]),
      );
    }
    reader.addField("entries", entries, {
      offset: entriesOffset,
      byteLength: reader.getCurrentOffset() - entriesOffset,
    });
  },
};
