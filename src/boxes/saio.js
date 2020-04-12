export default {
  name: "Sample Auxiliary Information Offsets",
  description: "",

  parser(r) {
    const ret = {};
    ret.version = r.bytesToInt(1);
    ret.flags = r.bytesToInt(3);

    if (ret.flags == 1)
    {
      ret.aux_info_type = r.bytesToInt(4);
      ret.aux_info_type_parameter = r.bytesToInt(4);
    }

    ret.entry_count = r.bytesToInt(4);

    ret.offset = [];
    let i = ret.entry_count;
    while (i--)
    {
      ret.offset.push(r.bytesToInt((ret.version == 0) ? 4 : 8));
    }

    return ret;
  },
};
