/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Track Extension Properties Box",
  description:
    "Carries extra properties associated with a movie-fragment track.",
  container: true,

  parser(r) {
    return {
      version: r.bytesToInt(1),
      flags: r.bytesToInt(3),
      track_id: r.bytesToInt(4),
    };
  },
};
