import { bitsField } from "../fields.js";

/** @type {import("./types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "HEVC Decoder Configuration Record",
  description:
    "Stores HEVC decoder configuration, including profile data and NAL arrays.",

  parser(r) {
    r.fieldUint("configurationVersion", 1);

    const generalProfile = bitsField(r.readUint(1), 8, [
      { key: "general_profile_space", bits: 2 },
      { key: "general_tier_flag", bits: 1 },
      { key: "general_profile_idc", bits: 5 },
    ]);
    r.addField("general_profile_space", generalProfile.fields[0].value);
    r.addField("general_tier_flag", generalProfile.fields[1].value !== 0);
    r.addField("general_profile_idc", generalProfile.fields[2].value);

    r.fieldUint("general_profile_compatibility_flags", 4);
    r.fieldUint("general_level_idc", 1);
    const constraintUpper = r.readUint(4);
    const constraintLower = r.readUint(2);
    r.addField(
      "general_constraint_indicator_flags",
      constraintUpper * 0x10000 + constraintLower,
    );

    const minSpatialSegmentation = bitsField(r.readUint(2), 16, [
      { key: "reserved", bits: 4 },
      { key: "value", bits: 12 },
    ]);
    r.addField("min_spatial_segmentation_idc", minSpatialSegmentation.value);

    const parallelismType = bitsField(r.readUint(1), 8, [
      { key: "reserved", bits: 6 },
      { key: "value", bits: 2 },
    ]);
    r.addField("parallelismType", parallelismType.value);

    const chromaFormat = bitsField(r.readUint(1), 8, [
      { key: "reserved", bits: 6 },
      { key: "value", bits: 2 },
    ]);
    r.addField("chromaFormat", chromaFormat.value);

    const bitDepthLumaMinus8 = bitsField(r.readUint(1), 8, [
      { key: "reserved", bits: 5 },
      { key: "value", bits: 3 },
    ]);
    r.addField("bitDepthLumaMinus8", bitDepthLumaMinus8.value);

    const bitDepthChromaMinus8 = bitsField(r.readUint(1), 8, [
      { key: "reserved", bits: 5 },
      { key: "value", bits: 3 },
    ]);
    r.addField("bitDepthChromaMinus8", bitDepthChromaMinus8.value);

    r.fieldUint("avgFrameRate", 2);

    const misc = bitsField(r.readUint(1), 8, [
      { key: "constantFrameRate", bits: 2 },
      { key: "numTemporalLayers", bits: 3 },
      { key: "temporalIdNested", bits: 1 },
      { key: "lengthSizeMinusOne", bits: 2 },
    ]);
    r.addField("constantFrameRate", misc.fields[0].value);
    r.addField("numTemporalLayers", misc.fields[1].value);
    r.addField("temporalIdNested", misc.fields[2].value !== 0);
    r.addField("lengthSizeMinusOne", misc.fields[3].value);

    const numOfArrays = r.fieldUint("numOfArrays", 1);
    const arrays = [];

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

      arrays.push({
        array_completeness: arrayCompleteness.fields[0].value !== 0,
        reserved: arrayCompleteness.fields[1].value !== 0,
        NAL_unit_type: arrayCompleteness.fields[2].value,
        numNalus,
        nalus,
      });
    }
    r.addField("arrays", arrays);
  },
};
