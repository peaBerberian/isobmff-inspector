import { bitsField, parsedBoxValue, structField } from "../fields.js";

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Independent and Disposable Samples Box",
  description: "Records dependency flags for samples in decoding order.",

  parser(r) {
    r.fieldUint("version", 1);
    r.fieldUint("flags", 3);

    /** @type Array<Partial<Record<string, unknown>>> */
    const samples = [];
    const samplesOffset = r.getCurrentOffset();
    while (!r.isFinished()) {
      const packed = bitsField(r.readUint(1), 8, [
        { key: "is_leading", bits: 2 },
        { key: "sample_depends_on", bits: 2 },
        { key: "sample_is_depended_on", bits: 2 },
        { key: "sample_has_redundancy", bits: 2 },
      ]);
      samples.push(
        structField(
          packed.fields.map((field) => parsedBoxValue(field.key, field.value)),
        ),
      );
    }
    r.addField("samples", samples, {
      offset: samplesOffset,
      byteLength: r.getCurrentOffset() - samplesOffset,
    });
  },
};
