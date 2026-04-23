/**
 * @typedef {Object} TrackFragmentRandomAccessBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} track_ID
 * @property {number} reserved
 * @property {number} length_size_of_traf_num
 * @property {number} length_size_of_trun_num
 * @property {number} length_size_of_sample_num
 * @property {number} number_of_entry
 * @property {Array<TrackFragmentRandomAccessEntry>} entries
 */

/**
 * @typedef {Object} TrackFragmentRandomAccessEntry
 * @property {number|bigint} time
 * @property {number|bigint} moof_offset
 * @property {number} traf_number
 * @property {number} trun_number
 * @property {number} sample_number
 */

/** @type {import("./types.js").BoxDefinition<TrackFragmentRandomAccessBoxContent>} */
export default {
  name: "Track Fragment Random Access Box",
  description:
    "Lists sync sample presentation times and their fragment locations " +
    "for a given track.",

  parser(reader) {
    const version = reader.fieldUint("version", 1, "tfra box version");
    if (version > 1) {
      throw new Error("invalid version");
    }
    reader.fieldUint("flags", 3, "tfra box flags");
    reader.fieldUint(
      "track_ID",
      4,
      "Track ID to which this random access table applies",
    );

    const lengths = reader.readUint(4);
    const reserved = lengths >>> 6;
    const length_size_of_traf_num = (lengths >>> 4) & 0x3;
    const length_size_of_trun_num = (lengths >>> 2) & 0x3;
    const length_size_of_sample_num = lengths & 0x3;
    reader.addField("reserved", reserved);
    reader.addField("length_size_of_traf_num", length_size_of_traf_num);
    reader.addField("length_size_of_trun_num", length_size_of_trun_num);
    reader.addField("length_size_of_sample_num", length_size_of_sample_num);

    const number_of_entry = reader.fieldUint(
      "number_of_entry",
      4,
      "Number of random access entries for this track",
    );

    /** @type {Array<TrackFragmentRandomAccessEntry>} */
    const entries = [];
    for (let i = 0; i < number_of_entry; i++) {
      entries.push({
        time: version === 1 ? reader.readUint64() : reader.readUint(4),
        moof_offset: version === 1 ? reader.readUint64() : reader.readUint(4),
        traf_number: reader.readUint(length_size_of_traf_num + 1),
        trun_number: reader.readUint(length_size_of_trun_num + 1),
        sample_number: reader.readUint(length_size_of_sample_num + 1),
      });
    }
    reader.addField("entries", entries);
  },
};
