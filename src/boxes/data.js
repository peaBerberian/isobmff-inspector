/**
 * @param {import("../BoxReader.js").BoxReader<{ [key: string]: unknown }>} reader
 * @param {number} typeCode
 * @param {number} length
 * @returns {void}
 */
function keepInvalidIntegerPayloadAsBytes(reader, typeCode, length) {
  reader.addIssue(
    "warning",
    `Metadata integer type ${typeCode} is defined for 1 to 4 byte payloads, got ${length} byte(s); keeping raw payload bytes.`,
  );
  reader.fieldBytes("value", length);
}

/** @type {import("./types.js").BoxDefinition<{ [key: string]: unknown }>} */
export default {
  name: "Metadata Value Box",
  description: "Carries a typed metadata value for an Apple metadata item.",

  parser(reader) {
    const type_set = reader.fieldUint("type_set", 1);
    const type_code = reader.fieldUint("type_code", 3);
    reader.fieldUint("locale", 4);

    const remaining = reader.getRemainingLength();
    if (type_set !== 0) {
      reader.addIssue(
        "warning",
        `Unsupported metadata type set ${type_set}; keeping raw payload bytes.`,
      );
      reader.fieldBytes("value", remaining);
      return;
    }

    switch (type_code) {
      case 1: {
        const baseOffset = reader.getCurrentOffset();
        reader.addField(
          "value",
          // TODO: Add `reader.fieldUtf8(key, nbBytes)` API?
          new TextDecoder().decode(reader.readBytes(remaining)),
          {
            description: "UTF-8 metadata value.",
            offset: baseOffset,
            byteLength: remaining,
          },
        );
        return;
      }

      case 21:
        if (remaining < 1 || remaining > 4) {
          keepInvalidIntegerPayloadAsBytes(reader, type_code, remaining);
          return;
        }
        reader.fieldSignedInt(
          "value",
          remaining,
          "Signed big-endian integer metadata value.",
        );
        return;

      case 22:
        if (remaining < 1 || remaining > 4) {
          keepInvalidIntegerPayloadAsBytes(reader, type_code, remaining);
          return;
        }
        reader.fieldUint(
          "value",
          remaining,
          "Unsigned big-endian integer metadata value.",
        );
        return;

      default:
        reader.fieldBytes("value", remaining);
    }
  },
};
