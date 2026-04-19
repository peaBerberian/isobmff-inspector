/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "AVC Decoder Configuration Record",
  description:
    "Stores AVC decoder configuration, including profile data and parameter sets.",

  parser(r) {
    const configurationVersion = r.bytesToInt(1);
    const AVCProfileIndication = r.bytesToInt(1);
    const profileCompatibility = r.bytesToInt(1);
    const AVCLevelIndication = r.bytesToInt(1);
    const lengthSizeMinusOneByte = r.bytesToInt(1);
    const numOfSequenceParameterSetsByte = r.bytesToInt(1);
    const numOfSequenceParameterSets = numOfSequenceParameterSetsByte & 0x1f;
    const sequenceParameterSets = [];

    for (let i = 0; i < numOfSequenceParameterSets; i++) {
      const sequenceParameterSetLength = r.bytesToInt(2);
      sequenceParameterSets.push({
        length: sequenceParameterSetLength,
        data: r.bytesToHex(sequenceParameterSetLength),
      });
    }

    const numOfPictureParameterSets = r.bytesToInt(1);
    const pictureParameterSets = [];

    for (let i = 0; i < numOfPictureParameterSets; i++) {
      const pictureParameterSetLength = r.bytesToInt(2);
      pictureParameterSets.push({
        length: pictureParameterSetLength,
        data: r.bytesToHex(pictureParameterSetLength),
      });
    }

    /** @type Partial<Record<string, unknown>> */
    const ret = {
      configurationVersion,
      AVCProfileIndication,
      profileCompatibility,
      AVCLevelIndication,
      lengthSizeMinusOne: lengthSizeMinusOneByte & 0x03,
      numOfSequenceParameterSets,
      sequenceParameterSets,
      numOfPictureParameterSets,
      pictureParameterSets,
    };

    if (!r.isFinished()) {
      ret.ext = r.bytesToHex(r.getRemainingLength());
    }

    return ret;
  },
};
