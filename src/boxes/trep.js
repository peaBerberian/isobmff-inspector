/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Track Extension Properties Box",
  description: "",
  container: true,

  parser(r) {
    return {
      version: r.bytesToInt(1),
      flags: r.bytesToInt(3),
      track_id: r.bytesToInt(4),
    };
  },
};
