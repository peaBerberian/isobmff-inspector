export default {
  name: "Metadata Box",
  description: "",
  container: true,

  parser(r) {
    const version = r.bytesToInt(1);
    if (version !== 0) {
      throw new Error("invalid version");
    }

    return {
      version,
      flags: r.bytesToInt(3),
    };
  },
};
