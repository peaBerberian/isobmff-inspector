export default {
  name: "Sample Description",
  description: "Information about the coding type used",

  parser(r) {
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);

    ret.entry_count = r.bytesToInt(4);
    return ret;
  },
  container: true,
};
