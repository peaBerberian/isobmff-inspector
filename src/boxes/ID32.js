function decodeIso639Language(code) {
  return String.fromCharCode(
    ((code >> 10) & 0x1f) + 0x60,
    ((code >> 5) & 0x1f) + 0x60,
    (code & 0x1f) + 0x60,
  );
}

export default {
  name: "ID3 Metadata Box",
  description: "",

  parser(r) {
    const version = r.bytesToInt(1);
    const flags = r.bytesToInt(3);
    const languageCode = r.bytesToInt(2);
    const data = r.bytesToHex(r.getRemainingLength());

    return {
      version,
      flags,
      language: decodeIso639Language(languageCode),
      data,
    };
  },
};
