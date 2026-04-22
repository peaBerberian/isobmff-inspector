import { parsedBoxValue, structField } from "../fields.js";

/**
 * @param {import("../types.js").BoxReader<{ [k: string]: unknown }>} reader
 * @param {number} ivSize
 * @param {boolean} useSubsamples
 * @returns {import("../types.js").ParsedStructField}
 */
function readSampleEncryptionEntry(reader, ivSize, useSubsamples) {
  const fields = [];
  if (ivSize > 0) {
    fields.push(parsedBoxValue("iv", reader.readHex(ivSize)));
  }

  if (useSubsamples) {
    const subsampleCount = reader.readUint(2);
    fields.push(parsedBoxValue("subsample_count", subsampleCount));

    /** @type {import("../types.js").ParsedStructField[]} */
    const subsamples = [];
    for (let i = 0; i < subsampleCount && !reader.isFinished(); i++) {
      subsamples.push(
        structField([
          parsedBoxValue("bytes_of_clear_data", reader.readUint(2)),
          parsedBoxValue("bytes_of_protected_data", reader.readUint(4)),
        ]),
      );
    }
    fields.push(parsedBoxValue("subsamples", subsamples));
  }

  return structField(fields);
}

/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Sample Encryption Box",
  description:
    "Carries per-sample IVs and optional subsample clear/encrypted byte counts for CENC-protected samples.",

  parser(reader) {
    reader.fieldUint("version", 1);
    const flags = reader.fieldFlags("flags", 3, {
      override_track_encryption_defaults: 0x000001,
      use_subsample_encryption: 0x000002,
    });
    const overrideTrackDefaults = (flags & 0x01) !== 0;
    const useSubsamples = (flags & 0x02) !== 0;

    let perSampleIvSize = null;
    if (overrideTrackDefaults) {
      reader.fieldUint("algorithm_id", 3);
      perSampleIvSize = reader.fieldUint("per_sample_iv_size", 1);
      reader.fieldHex("kid", 16);
    }

    const sample_count = reader.fieldUint("sample_count", 4);

    if (perSampleIvSize === null) {
      if (!reader.isFinished()) {
        reader.addIssue(
          "warning",
          "senc entry layout depends on tenc/seig context when track defaults are not overridden; remaining payload kept opaque.",
        );
        reader.fieldHex("sample_encryption_data", reader.getRemainingLength());
      }
      return;
    }

    /** @type {import("../types.js").ParsedStructField[]} */
    const entries = [];
    for (let i = 0; i < sample_count && !reader.isFinished(); i++) {
      entries.push(
        readSampleEncryptionEntry(reader, perSampleIvSize, useSubsamples),
      );
    }
    reader.addField("entries", entries);

    if (!reader.isFinished()) {
      reader.fieldHex("trailing_bytes", reader.getRemainingLength());
    }
  },
};
