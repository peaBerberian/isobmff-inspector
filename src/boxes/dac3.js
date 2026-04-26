// XXX TODO:
import { bitsField } from "../fields.js";

const BIT_RATE_TABLE = [
  32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 448, 512,
  576, 640,
];

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "AC-3 Specific Box",
  description:
    "Packed AC-3 decoder configuration carrying stream identification, channel mode, LFE presence and bitrate code.",

  parser(reader) {
    const packedOffset = reader.getCurrentOffset();
    const packed = bitsField(reader.readUint(3), 24, [
      { key: "fscod", bits: 2 },
      { key: "bsid", bits: 5 },
      { key: "bsmod", bits: 3 },
      { key: "acmod", bits: 3 },
      { key: "lfeon", bits: 1 },
      { key: "bit_rate_code", bits: 5 },
      { key: "reserved", bits: 5 },
    ]);

    let bitRateCode = 0;
    for (const field of packed.fields) {
      reader.addField(field.key, field.value, {
        offset: packedOffset,
        byteLength: 3,
      });
      if (field.key === "bit_rate_code") {
        bitRateCode = field.value;
      }
    }

    reader.addField(
      "data_rate_kbps",
      bitRateCode < BIT_RATE_TABLE.length ? BIT_RATE_TABLE[bitRateCode] : null,
    );
  },
};
