import { bitsField, parsedBoxValue, structField } from "../fields.js";
import { toSignedInt } from "./helpers.js";

/**
 * @param {string|number} groupingType
 * @param {Uint8Array} data
 * @returns {import("../types.js").ParsedStructField | import("../types.js").ParsedStringField}
 */
function parseGroupEntry(groupingType, data) {
  if (groupingType === "roll" || groupingType === "prol") {
    const raw = (data[0] << 8) | data[1];
    return structField([parsedBoxValue("roll_distance", toSignedInt(raw, 16))]);
  }
  if (groupingType === "rap ") {
    const packed = bitsField(data[0], 8, [
      { key: "num_leading_samples_known", bits: 1 },
      { key: "num_leading_samples", bits: 7 },
    ]);
    return structField(
      packed.fields.map((field) => parsedBoxValue(field.key, field.value)),
    );
  }
  if (groupingType === "sync") {
    return structField([
      parsedBoxValue(
        "nal_unit_type",
        bitsField(data[0], 8, [
          { key: "reserved", bits: 2 },
          { key: "value", bits: 6 },
        ]).value,
      ),
    ]);
  }
  if (groupingType === "seig") {
    const useMultikey = (data[0] >> 7) & 0x01;
    const extPattern = (data[0] >> 6) & 0x01;
    let cursor = 1;
    let cryptByteBlock;
    let skipByteBlock;
    if (extPattern) {
      cryptByteBlock =
        (data[cursor] << 24) |
        (data[cursor + 1] << 16) |
        (data[cursor + 2] << 8) |
        data[cursor + 3];
      cursor += 4;
      skipByteBlock =
        (data[cursor] << 24) |
        (data[cursor + 1] << 16) |
        (data[cursor + 2] << 8) |
        data[cursor + 3];
      cursor += 4;
    } else {
      cryptByteBlock = (data[cursor] >> 4) & 0x0f;
      skipByteBlock = data[cursor] & 0x0f;
      cursor += 1;
    }

    const isProtected = data[cursor++];
    const fields = [
      parsedBoxValue("multikey", useMultikey),
      parsedBoxValue("pattern_extended", extPattern),
      parsedBoxValue("crypt_byte_block", cryptByteBlock),
      parsedBoxValue("skip_byte_block", skipByteBlock),
      parsedBoxValue("is_protected", isProtected),
    ];

    if (useMultikey) {
      fields.push(
        parsedBoxValue(
          "key_info",
          Array.from(data.slice(cursor))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join(""),
        ),
      );
      return structField(fields);
    }

    const perSampleIvSize = data[cursor++];
    const kid = Array.from(data.slice(cursor, cursor + 16))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    cursor += 16;

    fields.push(parsedBoxValue("per_sample_iv_size", perSampleIvSize));
    fields.push(parsedBoxValue("kid", kid));

    if (isProtected === 1 && perSampleIvSize === 0 && cursor < data.length) {
      const constantIvSize = data[cursor++];
      fields.push(parsedBoxValue("constant_iv_size", constantIvSize));
      fields.push(
        parsedBoxValue(
          "constant_iv",
          Array.from(data.slice(cursor, cursor + constantIvSize))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join(""),
        ),
      );
    }

    return structField(fields);
  }

  return {
    kind: "string",
    value: Array.from(data)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(""),
  };
}

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample Group Description Box",
  description:
    "Defines group-description payloads referenced by sbgp mappings, including roll recovery and CENC seig entries.",

  parser(reader) {
    const version = reader.fieldUint("version", 1);
    reader.fieldUint("flags", 3);
    const grouping_type = reader.fieldFourCc("grouping_type");

    let defaultLength = 0;
    if (version >= 1) {
      defaultLength = reader.fieldUint("default_length", 4);
    }
    if (version >= 2) {
      reader.fieldUint("default_description_index", 4);
    }

    const entry_count = reader.fieldUint("entry_count", 4);

    /** @type {(import("../types.js").ParsedStructField | import("../types.js").ParsedStringField)[]} */
    const entries = [];
    for (let i = 0; i < entry_count && !reader.isFinished(); i++) {
      let descriptionLength = defaultLength;
      if (version === 0) {
        if (entry_count === 1) {
          descriptionLength = reader.getRemainingLength();
        } else {
          reader.addIssue(
            "warning",
            "Version 0 sgpd entry sizing is ambiguous; remaining payload is left unread.",
          );
          break;
        }
      } else if (defaultLength === 0) {
        descriptionLength = reader.readUint(4);
      }

      if (descriptionLength > reader.getRemainingLength()) {
        reader.addIssue("error", "sgpd entry exceeds remaining payload");
        break;
      }

      const bytes = new Uint8Array(descriptionLength);
      for (let j = 0; j < descriptionLength; j++) {
        bytes[j] = reader.readUint(1);
      }
      entries.push(parseGroupEntry(grouping_type, bytes));
    }

    reader.addField("entries", entries);
  },
};
