/**
 * @typedef {Object} OpusSpecificBoxContent
 * @property {number} Version
 * @property {number} OutputChannelCount
 * @property {number} PreSkip
 * @property {number} InputSampleRate
 * @property {number} OutputGain
 * @property {number} ChannelMappingFamily
 * @property {number} [StreamCount]
 * @property {number} [CoupledCount]
 * @property {number[]} [ChannelMapping]
 */

/** @type {import("../types.js").BoxDefinition<OpusSpecificBoxContent>} */
export default {
  name: "Opus Specific Box",
  description:
    "Stores the Opus decoder configuration equivalent to the Ogg OpusHead payload.",

  parser(reader) {
    // Derived from https://www.opus-codec.org/docs/opus_in_isobmff.html
    reader.fieldUint("Version", 1);
    const cCount = reader.fieldUint("OutputChannelCount", 1);
    reader.fieldUint("PreSkip", 2);
    reader.fieldUint("InputSampleRate", 4);
    reader.fieldSignedInt("OutputGain", 2, 16);
    const channelMappingFamily = reader.fieldUint("ChannelMappingFamily", 1);
    if (channelMappingFamily !== 0 && !reader.isFinished()) {
      reader.fieldUint("StreamCount", 1);
      reader.fieldUint("CoupledCount", 1);
      /** @type Array<number> */
      const mapping = [];
      for (let i = 0; i < cCount && !reader.isFinished(); i++) {
        mapping.push(reader.readUint(1));
      }
      reader.addField("ChannelMapping", mapping);
    }
  },
};
