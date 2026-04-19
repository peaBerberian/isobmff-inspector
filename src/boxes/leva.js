/** @type {import("../types.js").BoxDefinition<{ [k: string]: unknown }>} */
export default {
  name: "Level Assignment Box",
  description:
    "Assigns media data to levels for partial presentation selection.",

  // TODO
  parser(reader) {
    const version = reader.bytesToInt(1);
    const flags = reader.bytesToInt(3);

    // ...

    return {
      version,
      flags,
    };
  },
};
