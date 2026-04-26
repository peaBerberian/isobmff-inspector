import { bitsField, parsedBoxValue, structField } from "../fields.js";

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "EC-3 Specific Box",
  description:
    "Packed EC-3 decoder configuration listing independent substreams and optional Atmos/JOC extension signalling.",

  parser(reader) {
    const header = reader.fieldBits("header", 2, [
      { key: "data_rate", bits: 13 },
      { key: "num_ind_sub", bits: 3 },
    ]);
    const substreamCount = (header & 0x7) + 1;

    /** @type {import("../types.js").ParsedStructField[]} */
    const substreams = [];
    const substreamsOffset = reader.getCurrentOffset();

    for (let i = 0; i < substreamCount && !reader.isFinished(); i++) {
      const entryHeader = bitsField(reader.readUint(3), 24, [
        { key: "fscod", bits: 2 },
        { key: "bsid", bits: 5 },
        { key: "bsmod", bits: 5 },
        { key: "acmod", bits: 3 },
        { key: "lfeon", bits: 1 },
        { key: "reserved", bits: 3 },
        { key: "num_dep_sub", bits: 4 },
        { key: "__tail", bits: 1 },
      ]);

      let numDepSub = 0;
      let tail = 0;
      const fields = [];
      for (const field of entryHeader.fields) {
        if (field.key === "__tail") {
          tail = field.value;
          continue;
        }
        if (field.key === "num_dep_sub") {
          numDepSub = field.value;
        }
        fields.push(parsedBoxValue(field.key, field.value));
      }

      if (numDepSub > 0 && !reader.isFinished()) {
        fields.push(
          parsedBoxValue("chan_loc", (tail << 8) | reader.readUint(1)),
        );
      } else {
        fields.push(parsedBoxValue("reserved_2", tail));
      }

      substreams.push(structField(fields));
    }
    reader.addField("substreams", substreams, {
      offset: substreamsOffset,
      byteLength: reader.getCurrentOffset() - substreamsOffset,
    });

    if (reader.getRemainingLength() >= 2) {
      const extensionOffset = reader.getCurrentOffset();
      const extension = bitsField(reader.readUint(1), 8, [
        { key: "reserved", bits: 7 },
        { key: "flag_ec3_extension_type_a", bits: 1 },
      ]);
      reader.addField(
        "ec3_extension",
        structField([
          ...extension.fields.map((field) =>
            parsedBoxValue(field.key, field.value),
          ),
          parsedBoxValue("complexity_index_type_a", reader.readUint(1)),
        ]),
        {
          offset: extensionOffset,
          byteLength: reader.getCurrentOffset() - extensionOffset,
        },
      );
    }

    if (!reader.isFinished()) {
      reader.fieldBytes("trailing_bytes", reader.getRemainingLength());
    }
  },
};
