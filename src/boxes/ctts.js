/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Composition Time to Sample Box",
  description:
    "Maps samples to composition-time offsets for presentation order.",

  parser(r) {
    const version = r.bytesToInt(1);
    if (version > 1) {
      throw new Error("invalid version");
    }

    const flags = r.bytesToInt(3);
    const entry_count = r.bytesToInt(4);
    const entries = [];

    for (let i = 0; i < entry_count; i++) {
      entries.push({
        sample_count: r.bytesToInt(4),
        sample_offset: version === 0 ? r.bytesToInt(4) : ~~r.bytesToInt(4),
      });
    }

    return {
      version,
      flags,
      entry_count,
      entries,
    };
  },
};
