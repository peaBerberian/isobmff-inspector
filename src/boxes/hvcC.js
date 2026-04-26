import { bitsField, parsedBoxValue, structField } from "../fields.js";

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "HEVC Decoder Configuration Record",
  description:
    "Stores HEVC decoder configuration, including profile data and NAL arrays.",

  parser(r) {
    r.fieldUint("configurationVersion", 1);

    r.fieldBits("general_profile", 1, [
      { key: "general_profile_space", bits: 2 },
      { key: "general_tier_flag", bits: 1 },
      { key: "general_profile_idc", bits: 5 },
    ]);

    r.fieldUint("general_profile_compatibility_flags", 4);
    r.fieldUint("general_level_idc", 1);
    const constraintOffset = r.getCurrentOffset();
    const constraintUpper = r.readUint(4);
    const constraintLower = r.readUint(2);
    r.addField(
      "general_constraint_indicator_flags",
      constraintUpper * 0x10000 + constraintLower,
      {
        offset: constraintOffset,
        byteLength: 6,
      },
    );

    r.fieldBits("min_spatial_segmentation_idc", 2, [
      { key: "reserved", bits: 4 },
      { key: "value", bits: 12 },
    ]);

    r.fieldBits("parallelismType", 1, [
      { key: "reserved", bits: 6 },
      { key: "value", bits: 2 },
    ]);

    r.fieldBits("chromaFormat", 1, [
      { key: "reserved", bits: 6 },
      { key: "value", bits: 2 },
    ]);

    r.fieldBits("bitDepthLumaMinus8", 1, [
      { key: "reserved", bits: 5 },
      { key: "value", bits: 3 },
    ]);

    r.fieldBits("bitDepthChromaMinus8", 1, [
      { key: "reserved", bits: 5 },
      { key: "value", bits: 3 },
    ]);

    r.fieldUint("avgFrameRate", 2);

    r.fieldBits("misc", 1, [
      { key: "constantFrameRate", bits: 2 },
      { key: "numTemporalLayers", bits: 3 },
      { key: "temporalIdNested", bits: 1 },
      { key: "lengthSizeMinusOne", bits: 2 },
    ]);

    const numOfArrays = r.fieldUint("numOfArrays", 1);
    const arrays = [];
    const arraysOffset = r.getCurrentOffset();

    for (let i = 0; i < numOfArrays; i++) {
      const arrayCompleteness = bitsField(r.readUint(1), 8, [
        { key: "array_completeness", bits: 1 },
        { key: "reserved", bits: 1 },
        { key: "NAL_unit_type", bits: 6 },
      ]);
      const numNalus = r.readUint(2);
      const nalus = [];

      for (let j = 0; j < numNalus; j++) {
        const nalUnitLength = r.readUint(2);
        nalus.push({
          length: nalUnitLength,
          data: r.readBytes(nalUnitLength),
        });
      }

      arrays.push(
        structField([
          parsedBoxValue(
            "array_completeness",
            arrayCompleteness.fields[0].value,
          ),
          parsedBoxValue("reserved", arrayCompleteness.fields[1].value),
          parsedBoxValue("NAL_unit_type", arrayCompleteness.fields[2].value),
          parsedBoxValue("numNalus", numNalus),
          parsedBoxValue("nalus", nalus),
        ]),
      );
    }
    r.addField("arrays", arrays, {
      offset: arraysOffset,
      byteLength: r.getCurrentOffset() - arraysOffset,
    });
  },
};
