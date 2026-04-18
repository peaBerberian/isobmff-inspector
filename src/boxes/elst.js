import { toSignedInt } from "./helpers.js";

export default {
  name: "Edit List Box",
  description: "",

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
        segment_duration:
          version === 0 ? r.bytesToInt(4) : r.bytesToUint64BigInt(),
        media_time: version === 0 ? ~~r.bytesToInt(4) : r.bytesToInt64BigInt(),
        media_rate_integer: toSignedInt(r.bytesToInt(2), 16),
        media_rate_fraction: r.bytesToInt(2),
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
