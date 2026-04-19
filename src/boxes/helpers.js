/**
 * @param {number} value
 * @returns {string}
 */
function formatFixedPoint1616(value) {
  return `${value >>> 16}.${value & 0xffff}`;
}

/**
 * @param {number} value
 * @param {number} bits
 * @returns {number}
 */
function toSignedInt(value, bits) {
  const maxUnsigned = 2 ** bits;
  const signedBoundary = 2 ** (bits - 1);
  return value >= signedBoundary ? value - maxUnsigned : value;
}

/**
 * @param {import("../types").BufferReader} r
 * @param {number} length
 * @returns {string}
 */
function parsePascalString(r, length) {
  const stringLength = Math.min(r.bytesToInt(1), length - 1);
  const value = stringLength > 0 ? r.bytesToASCII(stringLength) : "";
  const paddingLength = length - 1 - stringLength;
  if (paddingLength > 0) {
    r.bytesToHex(paddingLength);
  }
  return value;
}

/**
 * @typedef {Object} VisualSampleEntry
 * @property {number[]} reserved - 6 reserved bytes
 * @property {number} data_reference_index
 * @property {number} pre_defined
 * @property {number} reserved_1
 * @property {[number, number, number]} pre_defined_1
 * @property {number} width
 * @property {number} height
 * @property {string} horizresolution - 16.16 fixed point
 * @property {string} vertresolution - 16.16 fixed point
 * @property {number} reserved_2
 * @property {number} frame_count
 * @property {string} compressorname
 * @property {number} depth
 * @property {number} pre_defined_2
 */

/**
 * @param {import("../types").BufferReader} r
 * @returns {VisualSampleEntry}
 */
function parseVisualSampleEntry(r) {
  const reserved = [];
  for (let i = 0; i < 6; i++) {
    reserved.push(r.bytesToInt(1));
  }
  return {
    reserved,
    data_reference_index: r.bytesToInt(2),
    pre_defined: r.bytesToInt(2),
    reserved_1: r.bytesToInt(2),
    pre_defined_1: [r.bytesToInt(4), r.bytesToInt(4), r.bytesToInt(4)],
    width: r.bytesToInt(2),
    height: r.bytesToInt(2),
    horizresolution: formatFixedPoint1616(r.bytesToInt(4)),
    vertresolution: formatFixedPoint1616(r.bytesToInt(4)),
    reserved_2: r.bytesToInt(4),
    frame_count: r.bytesToInt(2),
    compressorname: parsePascalString(r, 32),
    depth: r.bytesToInt(2),
    pre_defined_2: r.bytesToInt(2),
  };
}

/**
 * @typedef {Object} AudioSampleEntryVersion1Fields
 * @property {number} samples_per_packet
 * @property {number} bytes_per_packet
 * @property {number} bytes_per_frame
 * @property {number} bytes_per_sample
 */

/**
 * @typedef {Object} AudioSampleEntryVersion2Fields
 * @property {number} struct_size
 * @property {string} sample_rate
 * @property {number} channel_count
 * @property {number} reserved
 * @property {number} bits_per_channel
 * @property {number} format_specific_flags
 * @property {number} bytes_per_audio_packet
 * @property {number} LPCM_frames_per_audio_packet
 */

/**
 * @typedef {Object} AudioSampleEntryBase
 * @property {number[]} reserved - 6 reserved bytes
 * @property {number} data_reference_index
 * @property {number} version
 * @property {number} revision_level
 * @property {number} vendor
 * @property {number} channelcount
 * @property {number} samplesize
 * @property {number} compression_id
 * @property {number} packet_size
 * @property {string} samplerate
 */

/**
 * @typedef {AudioSampleEntryBase & { version: 1, version_1_fields: AudioSampleEntryVersion1Fields }} AudioSampleEntryV1
 * @typedef {AudioSampleEntryBase & { version: 2, version_2_fields: AudioSampleEntryVersion2Fields }} AudioSampleEntryV2
 * @typedef {AudioSampleEntryBase | AudioSampleEntryV1 | AudioSampleEntryV2} AudioSampleEntry
 */

/**
 * @param {import("../types").BufferReader} r
 * @returns {AudioSampleEntry}
 */
function parseAudioSampleEntry(r) {
  const reserved = [];
  for (let i = 0; i < 6; i++) {
    reserved.push(r.bytesToInt(1));
  }

  const base = {
    reserved,
    data_reference_index: r.bytesToInt(2),
    version: r.bytesToInt(2),
    revision_level: r.bytesToInt(2),
    vendor: r.bytesToInt(4),
    channelcount: r.bytesToInt(2),
    samplesize: r.bytesToInt(2),
    compression_id: r.bytesToInt(2),
    packet_size: r.bytesToInt(2),
    samplerate: formatFixedPoint1616(r.bytesToInt(4)),
  };

  if (base.version === 1) {
    /** @type {AudioSampleEntryV1} */
    return {
      ...base,
      version_1_fields: {
        samples_per_packet: r.bytesToInt(4),
        bytes_per_packet: r.bytesToInt(4),
        bytes_per_frame: r.bytesToInt(4),
        bytes_per_sample: r.bytesToInt(4),
      },
    };
  } else if (base.version === 2) {
    /** @type {AudioSampleEntryV2} */
    return {
      ...base,
      version_2_fields: {
        struct_size: r.bytesToInt(4),
        sample_rate: formatFixedPoint1616(r.bytesToInt(4)),
        channel_count: r.bytesToInt(4),
        reserved: r.bytesToInt(4),
        bits_per_channel: r.bytesToInt(4),
        format_specific_flags: r.bytesToInt(4),
        bytes_per_audio_packet: r.bytesToInt(4),
        LPCM_frames_per_audio_packet: r.bytesToInt(4),
      },
    };
  }

  return base;
}

/**
 * @param {import("../types").BufferReader} r
 * @returns {{ length: number; size: number }}
 */
function parseDescriptorLength(r) {
  let length = 0;
  let size = 0;

  while (size < 4) {
    const currentByte = r.bytesToInt(1);
    size += 1;
    length = (length << 7) | (currentByte & 0x7f);
    if ((currentByte & 0x80) === 0) {
      return {
        length,
        size,
      };
    }
  }

  throw new Error("invalid descriptor length");
}

/**
 * @param {import("../types").BufferReader} r
 * @param {number} size
 * @returns {Array.<unknown>}
 */
function parseNestedDescriptors(r, size) {
  const descriptors = [];
  let remaining = size;

  while (remaining > 0) {
    const before = r.getRemainingLength();
    const descriptor = parseDescriptor(r);
    const consumed = before - r.getRemainingLength();
    remaining -= consumed;
    descriptors.push(descriptor);
  }

  if (remaining !== 0) {
    throw new Error("descriptor size mismatch");
  }

  return descriptors;
}

/**
 * @param {import("../types").BufferReader} r
 * @param {number} tag
 * @param {number} size
 * @returns {unknown}
 */
function parseDescriptorPayload(r, tag, size) {
  if (tag === 0x03) {
    const es_id = r.bytesToInt(2);
    const flags = r.bytesToInt(1);
    /** @type {Partial<Record<string, unknown>>} */
    const ret = {
      es_id,
      stream_dependence_flag: !!(flags & 0x80),
      URL_flag: !!(flags & 0x40),
      OCRstream_flag: !!(flags & 0x20),
      stream_priority: flags & 0x1f,
    };

    let consumed = 3;
    if (ret.stream_dependence_flag) {
      ret.depends_on_es_id = r.bytesToInt(2);
      consumed += 2;
    }
    if (ret.URL_flag) {
      const urlLength = r.bytesToInt(1);
      ret.URL_length = urlLength;
      ret.URL_string = urlLength > 0 ? r.bytesToASCII(urlLength) : "";
      consumed += 1 + urlLength;
    }
    if (ret.OCRstream_flag) {
      ret.ocr_es_id = r.bytesToInt(2);
      consumed += 2;
    }
    if (size > consumed) {
      ret.descriptors = parseNestedDescriptors(r, size - consumed);
    }
    return ret;
  }

  if (tag === 0x04) {
    const objectTypeIndication = r.bytesToInt(1);
    const streamByte = r.bytesToInt(1);
    /** @type {Partial<Record<string, unknown>>} */
    const ret = {
      object_type_indication: objectTypeIndication,
      stream_type: (streamByte >> 2) & 0x3f,
      up_stream: !!((streamByte >> 1) & 0x01),
      reserved: streamByte & 0x01,
      buffer_size_db: r.bytesToInt(3),
      max_bitrate: r.bytesToInt(4),
      avg_bitrate: r.bytesToInt(4),
    };

    if (size > 13) {
      ret.descriptors = parseNestedDescriptors(r, size - 13);
    }
    return ret;
  }

  if (tag === 0x05) {
    return {
      decoder_specific_info: size > 0 ? r.bytesToHex(size) : "",
    };
  }

  if (tag === 0x06) {
    return {
      predefined: r.bytesToInt(1),
      remaining_payload: size > 1 ? r.bytesToHex(size - 1) : "",
    };
  }

  return {
    data: size > 0 ? r.bytesToHex(size) : "",
  };
}

/**
 * @param {import("../types").BufferReader} r
 * @returns {unknown}
 */
function parseDescriptor(r) {
  const tag = r.bytesToInt(1);
  const { length, size } = parseDescriptorLength(r);
  return {
    tag,
    size: length,
    header_size: size + 1,
    payload: parseDescriptorPayload(r, tag, length),
  };
}

export {
  parseAudioSampleEntry,
  parseDescriptor,
  parseVisualSampleEntry,
  toSignedInt,
};
