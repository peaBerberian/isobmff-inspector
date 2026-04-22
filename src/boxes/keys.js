import { parsedBoxValue, structField } from "../fields.js";

/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Metadata Keys Box",
  description:
    "Maps integer metadata item keys to string identifiers, typically in the mdta namespace.",

  parser(reader) {
    reader.fieldUint("version", 1);
    reader.fieldUint("flags", 3);
    const entry_count = reader.fieldUint("entry_count", 4);

    /** @type {import("../types.js").ParsedStructField[]} */
    const entries = [];
    for (let i = 0; i < entry_count && !reader.isFinished(); i++) {
      const key_size = reader.readUint(4);
      const namespace = reader.readFourCc();
      const value_size = Math.max(0, key_size - 8);
      const value = value_size > 0 ? reader.readAsUtf8(value_size) : "";
      entries.push(
        structField([
          parsedBoxValue("key_size", key_size),
          parsedBoxValue("namespace", namespace),
          parsedBoxValue("value", value),
        ]),
      );
    }
    reader.addField("entries", entries);
  },
};
