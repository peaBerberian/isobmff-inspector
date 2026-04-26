/**
 * @typedef {Object} SegmentIndexReference
 * @property {number} reference_type
 * @property {number} referenced_size
 * @property {number} subsegment_duration
 * @property {number} starts_with_SAP
 * @property {number} SAP_type
 * @property {number} SAP_delta_time
 */

/**
 * @typedef {Object} SegmentIndexBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} reference_ID
 * @property {number} timescale
 * @property {number|bigint} earliest_presentation_time
 * @property {number|bigint} first_offset
 * @property {number} reserved
 * @property {number} reference_count
 * @property {SegmentIndexReference[]} items
 */

/** @type {import("./types.js").BoxDefinition<SegmentIndexBoxContent>} */
export default {
  name: "Segment Index Box",
  description: "Index of the media stream",

  parser(r) {
    const version = r.fieldUint("version", 1);
    r.fieldUint("flags", 3);
    r.fieldUint("reference_ID", 4);
    r.fieldUint("timescale", 4);
    if (version === 0) {
      r.fieldUint("earliest_presentation_time", 4);
      r.fieldUint("first_offset", 4);
    } else {
      r.fieldInt64("earliest_presentation_time");
      r.fieldInt64("first_offset");
    }
    r.fieldUint("reserved", 2);
    const reference_count = r.fieldUint("reference_count", 2);

    const items = [];
    const itemsOffset = r.getCurrentOffset();
    for (let i = 0; i < reference_count; i++) {
      const first4Bytes = r.readUint(4);
      const second4Bytes = r.readUint(4);
      const third4Bytes = r.readUint(4);
      items.push({
        reference_type: (first4Bytes >> 31) & 0x01,
        referenced_size: first4Bytes & 0x7fffffff,
        subsegment_duration: second4Bytes,
        starts_with_SAP: (third4Bytes >> 31) & 0x01,
        SAP_type: (third4Bytes >> 28) & 0x07,
        SAP_delta_time: third4Bytes & 0x0fffffff,
      });
    }
    r.addField("items", items, {
      offset: itemsOffset,
      byteLength: r.getCurrentOffset() - itemsOffset,
    });
  },
};
