/** @type {import("../types.js").BoxDefinition} */
export default {
  name: "Sync Sample Box",
  description: "",

  parser(r) {
    const version = r.bytesToInt(1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    const flags = r.bytesToInt(3);
    const entry_count = r.bytesToInt(4);
    const sample_numbers = [];

    for (let i = 0; i < entry_count; i++) {
      sample_numbers.push(r.bytesToInt(4));
    }

    return {
      version,
      flags,
      entry_count,
      sample_numbers,
    };
  },
};
