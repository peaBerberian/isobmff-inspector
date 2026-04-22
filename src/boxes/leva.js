/**
 * @typedef {Object} LevelAssignment
 * @property {number} track_id
 * @property {boolean} padding_flag
 * @property {number} assignment_type
 * @property {number=} grouping_type
 * @property {number=} grouping_type_parameter
 * @property {number=} sub_track_id
 */

/**
 * @typedef {Object} LevelAssignmentBoxContent
 * @property {number} version
 * @property {number} flags
 * @property {number} level_count
 * @property {LevelAssignment[]} levels
 */

/** @type {import("../types.js").BoxDefinition<LevelAssignmentBoxContent>} */
export default {
  name: "Level Assignment Box",
  description:
    "Assigns media data to levels for partial presentation selection.",

  parser(reader) {
    const version = reader.fieldUint(
      "version",
      1,
      "leva box version. Should be 0.",
    );
    if (version !== 0) {
      throw new Error("invalid version");
    }

    reader.fieldUint("flags", 3, "leva box flags. Should be 0.");
    const level_count = reader.fieldUint("level_count", 1);
    const levels = [];
    for (let i = 0; i < level_count; i++) {
      /** @type {LevelAssignment} */
      const assignment = {
        track_id: reader.bytesToInt(4),
        padding_flag: false,
        assignment_type: 0,
      };
      const assignmentByte = reader.bytesToInt(1);
      assignment.padding_flag = !!(assignmentByte & 0x80);
      assignment.assignment_type = assignmentByte & 0x7f;

      if (assignment.assignment_type === 0) {
        assignment.grouping_type = reader.bytesToInt(4);
      } else if (assignment.assignment_type === 1) {
        assignment.grouping_type = reader.bytesToInt(4);
        assignment.grouping_type_parameter = reader.bytesToInt(4);
      } else if (assignment.assignment_type === 4) {
        assignment.sub_track_id = reader.bytesToInt(4);
      } else if (
        assignment.assignment_type !== 2 &&
        assignment.assignment_type !== 3
      ) {
        throw new Error("invalid assignment_type");
      }

      levels.push(assignment);
    }
    reader.addField("levels", levels);
  },
};
