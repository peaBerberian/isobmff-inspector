/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "HEVC Decoder Configuration Record",
  description: "",

  parser(r) {
    const configurationVersion = r.bytesToInt(1);
    const generalProfileByte = r.bytesToInt(1);
    const generalCompatibilityFlagsUpper = r.bytesToInt(4);
    const generalLevelIdc = r.bytesToInt(1);
    const constraintUpper = r.bytesToInt(4);
    const constraintLower = r.bytesToInt(2);
    const minSpatialSegmentation = r.bytesToInt(2);
    const parallelismType = r.bytesToInt(1);
    const chromaFormat = r.bytesToInt(1);
    const bitDepthLumaMinus8 = r.bytesToInt(1);
    const bitDepthChromaMinus8 = r.bytesToInt(1);
    const avgFrameRate = r.bytesToInt(2);
    const miscByte = r.bytesToInt(1);
    const numOfArrays = r.bytesToInt(1);
    const arrays = [];

    for (let i = 0; i < numOfArrays; i++) {
      const arrayCompletenessByte = r.bytesToInt(1);
      const numNalus = r.bytesToInt(2);
      const nalus = [];

      for (let j = 0; j < numNalus; j++) {
        const nalUnitLength = r.bytesToInt(2);
        nalus.push({
          length: nalUnitLength,
          data: r.bytesToHex(nalUnitLength),
        });
      }

      arrays.push({
        array_completeness: !!((arrayCompletenessByte >> 7) & 0x01),
        reserved: !!((arrayCompletenessByte >> 6) & 0x01),
        NAL_unit_type: arrayCompletenessByte & 0x3f,
        numNalus,
        nalus,
      });
    }

    return {
      configurationVersion,
      general_profile_space: (generalProfileByte >> 6) & 0x03,
      general_tier_flag: !!((generalProfileByte >> 5) & 0x01),
      general_profile_idc: generalProfileByte & 0x1f,
      general_profile_compatibility_flags: generalCompatibilityFlagsUpper,
      general_constraint_indicator_flags:
        constraintUpper * 0x10000 + constraintLower,
      general_level_idc: generalLevelIdc,
      min_spatial_segmentation_idc: minSpatialSegmentation & 0x0fff,
      parallelismType: parallelismType & 0x03,
      chromaFormat: chromaFormat & 0x03,
      bitDepthLumaMinus8: bitDepthLumaMinus8 & 0x07,
      bitDepthChromaMinus8: bitDepthChromaMinus8 & 0x07,
      avgFrameRate,
      constantFrameRate: (miscByte >> 6) & 0x03,
      numTemporalLayers: (miscByte >> 3) & 0x07,
      temporalIdNested: !!((miscByte >> 2) & 0x01),
      lengthSizeMinusOne: miscByte & 0x03,
      numOfArrays,
      arrays,
    };
  },
};
