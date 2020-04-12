export default {
  name: "Sample Auxiliary Information Sizes",
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

    ret.default_sample_info_size = r.bytesToInt(1);
    ret.sample_count = r.bytesToInt(4);

    if (ret.default_sample_info_size == 0)
    {
      ret.sample_info_size = [];
      let i = ret.sample_count;
      while (i--)
      {
        ret.sample_info_size.push(r.bytesToInt(1));
      }
    }

    return ret;
  },
};
