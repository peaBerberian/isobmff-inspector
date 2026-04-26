/**
 * @typedef {Object} AvcParameterSet
 * @property {number} length
 * @property {Uint8Array} data
 */

/**
 * @typedef {Object} AvcDecoderConfigurationRecordContent
 * @property {number} configurationVersion
 * @property {number} AVCProfileIndication
 * @property {number} profile_compatibility
 * @property {number} AVCLevelIndication
 * @property {import("../types.js").ParsedBitsField} lengthSizeMinusOne
 * @property {import("../types.js").ParsedBitsField} numOfSequenceParameterSets
 * @property {AvcParameterSet[]} sequenceParameterSets
 * @property {number} numOfPictureParameterSets
 * @property {AvcParameterSet[]} pictureParameterSets
 * @property {Uint8Array=} ext
 */

/** @type {import("./types.js").BoxDefinition<AvcDecoderConfigurationRecordContent>} */
export default {
  name: "AVC Decoder Configuration Record",
  description:
    "Stores AVC decoder configuration, including profile data and parameter sets.",

  parser(reader) {
    reader.fieldUint("configurationVersion", 1);
    reader.fieldUint("AVCProfileIndication", 1);
    reader.fieldUint("profile_compatibility", 1);
    reader.fieldUint("AVCLevelIndication", 1);
    reader.fieldBits("lengthSizeMinusOne", 1, [
      { key: "reserved", bits: 6 },
      { key: "value", bits: 2 },
    ]);

    const numOfSequenceParameterSets = reader.fieldBits(
      "numOfSequenceParameterSets",
      1,
      [
        { key: "reserved", bits: 3 },
        { key: "value", bits: 5 },
      ],
    );
    const sequenceParameterSets = [];
    const sequenceParameterSetsOffset = reader.getCurrentOffset();
    for (let i = 0; i < numOfSequenceParameterSets; i++) {
      const sequenceParameterSetLength = reader.readUint(2);
      sequenceParameterSets.push({
        length: sequenceParameterSetLength,
        data: reader.readBytes(sequenceParameterSetLength),
      });
    }
    reader.addField("sequenceParameterSets", sequenceParameterSets, {
      offset: sequenceParameterSetsOffset,
      byteLength: reader.getCurrentOffset() - sequenceParameterSetsOffset,
    });

    const numOfPictureParameterSets = reader.fieldUint(
      "numOfPictureParameterSets",
      1,
    );
    const pictureParameterSets = [];
    const pictureParameterSetsOffset = reader.getCurrentOffset();
    for (let i = 0; i < numOfPictureParameterSets; i++) {
      const pictureParameterSetLength = reader.readUint(2);
      pictureParameterSets.push({
        length: pictureParameterSetLength,
        data: reader.readBytes(pictureParameterSetLength),
      });
    }
    reader.addField("pictureParameterSets", pictureParameterSets, {
      offset: pictureParameterSetsOffset,
      byteLength: reader.getCurrentOffset() - pictureParameterSetsOffset,
    });
    if (!reader.isFinished()) {
      reader.fieldBytes("ext", reader.getRemainingLength());
    }
  },
};
