(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() :
  typeof define === "function" && define.amd ? define(factory) :
  (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.inspectISOBMFF = factory());
})(this, function () {
  "use strict";

var __inspectISOBMFFBundle = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/main.js
  var main_exports = {};
  __export(main_exports, {
    default: () => parseBoxes
  });

  // src/boxes/helpers.js
  function formatFixedPoint1616(value) {
    return `${value >> 16}.${value & 65535}`;
  }
  function toSignedInt(value, bits) {
    const maxUnsigned = 2 ** bits;
    const signedBoundary = 2 ** (bits - 1);
    return value >= signedBoundary ? value - maxUnsigned : value;
  }
  function parsePascalString(r, length) {
    const stringLength = Math.min(r.bytesToInt(1), length - 1);
    const value = stringLength > 0 ? r.bytesToASCII(stringLength) : "";
    const paddingLength = length - 1 - stringLength;
    if (paddingLength > 0) {
      r.bytesToHex(paddingLength);
    }
    return value;
  }
  function parseVisualSampleEntry(r) {
    const reserved = [];
    for (let i = 0; i < 6; i++) {
      reserved.push(r.bytesToInt(1));
    }
    const ret = {
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
      pre_defined_2: r.bytesToInt(2)
    };
    return ret;
  }
  function parseAudioSampleEntry(r) {
    const reserved = [];
    for (let i = 0; i < 6; i++) {
      reserved.push(r.bytesToInt(1));
    }
    const ret = {
      reserved,
      data_reference_index: r.bytesToInt(2),
      version: r.bytesToInt(2),
      revision_level: r.bytesToInt(2),
      vendor: r.bytesToInt(4),
      channelcount: r.bytesToInt(2),
      samplesize: r.bytesToInt(2),
      compression_id: r.bytesToInt(2),
      packet_size: r.bytesToInt(2),
      samplerate: formatFixedPoint1616(r.bytesToInt(4))
    };
    if (ret.version === 1) {
      ret.version_1_fields = {
        samples_per_packet: r.bytesToInt(4),
        bytes_per_packet: r.bytesToInt(4),
        bytes_per_frame: r.bytesToInt(4),
        bytes_per_sample: r.bytesToInt(4)
      };
    } else if (ret.version === 2) {
      ret.version_2_fields = {
        struct_size: r.bytesToInt(4),
        sample_rate: formatFixedPoint1616(r.bytesToInt(4)),
        channel_count: r.bytesToInt(4),
        reserved: r.bytesToInt(4),
        bits_per_channel: r.bytesToInt(4),
        format_specific_flags: r.bytesToInt(4),
        bytes_per_audio_packet: r.bytesToInt(4),
        LPCM_frames_per_audio_packet: r.bytesToInt(4)
      };
    }
    return ret;
  }
  function parseDescriptorLength(r) {
    let length = 0;
    let size = 0;
    while (size < 4) {
      const currentByte = r.bytesToInt(1);
      size += 1;
      length = length << 7 | currentByte & 127;
      if ((currentByte & 128) === 0) {
        return {
          length,
          size
        };
      }
    }
    throw new Error("invalid descriptor length");
  }
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
  function parseDescriptorPayload(r, tag, size) {
    if (tag === 3) {
      const es_id = r.bytesToInt(2);
      const flags = r.bytesToInt(1);
      const ret = {
        es_id,
        stream_dependence_flag: !!(flags & 128),
        URL_flag: !!(flags & 64),
        OCRstream_flag: !!(flags & 32),
        stream_priority: flags & 31
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
    if (tag === 4) {
      const objectTypeIndication = r.bytesToInt(1);
      const streamByte = r.bytesToInt(1);
      const ret = {
        object_type_indication: objectTypeIndication,
        stream_type: streamByte >> 2 & 63,
        up_stream: !!(streamByte >> 1 & 1),
        reserved: streamByte & 1,
        buffer_size_db: r.bytesToInt(3),
        max_bitrate: r.bytesToInt(4),
        avg_bitrate: r.bytesToInt(4)
      };
      if (size > 13) {
        ret.descriptors = parseNestedDescriptors(r, size - 13);
      }
      return ret;
    }
    if (tag === 5) {
      return {
        decoder_specific_info: size > 0 ? r.bytesToHex(size) : ""
      };
    }
    if (tag === 6) {
      return {
        predefined: r.bytesToInt(1),
        remaining_payload: size > 1 ? r.bytesToHex(size - 1) : ""
      };
    }
    return {
      data: size > 0 ? r.bytesToHex(size) : ""
    };
  }
  function parseDescriptor(r) {
    const tag = r.bytesToInt(1);
    const { length, size } = parseDescriptorLength(r);
    return {
      tag,
      size: length,
      header_size: size + 1,
      payload: parseDescriptorPayload(r, tag, length)
    };
  }

  // src/boxes/avc1.js
  var avc1_default = {
    name: "AVC Sample Entry",
    description: "",
    container: true,
    parser(r) {
      return parseVisualSampleEntry(r);
    }
  };

  // src/boxes/avc3.js
  var avc3_default = {
    name: "AVC3 Sample Entry",
    description: "",
    container: true,
    parser(r) {
      return parseVisualSampleEntry(r);
    }
  };

  // src/boxes/avcC.js
  var avcC_default = {
    name: "AVC Decoder Configuration Record",
    description: "",
    parser(r) {
      const configurationVersion = r.bytesToInt(1);
      const AVCProfileIndication = r.bytesToInt(1);
      const profileCompatibility = r.bytesToInt(1);
      const AVCLevelIndication = r.bytesToInt(1);
      const lengthSizeMinusOneByte = r.bytesToInt(1);
      const numOfSequenceParameterSetsByte = r.bytesToInt(1);
      const numOfSequenceParameterSets = numOfSequenceParameterSetsByte & 31;
      const sequenceParameterSets = [];
      for (let i = 0; i < numOfSequenceParameterSets; i++) {
        const sequenceParameterSetLength = r.bytesToInt(2);
        sequenceParameterSets.push({
          length: sequenceParameterSetLength,
          data: r.bytesToHex(sequenceParameterSetLength)
        });
      }
      const numOfPictureParameterSets = r.bytesToInt(1);
      const pictureParameterSets = [];
      for (let i = 0; i < numOfPictureParameterSets; i++) {
        const pictureParameterSetLength = r.bytesToInt(2);
        pictureParameterSets.push({
          length: pictureParameterSetLength,
          data: r.bytesToHex(pictureParameterSetLength)
        });
      }
      const ret = {
        configurationVersion,
        AVCProfileIndication,
        profileCompatibility,
        AVCLevelIndication,
        lengthSizeMinusOne: lengthSizeMinusOneByte & 3,
        numOfSequenceParameterSets,
        sequenceParameterSets,
        numOfPictureParameterSets,
        pictureParameterSets
      };
      if (!r.isFinished()) {
        ret.ext = r.bytesToHex(r.getRemainingLength());
      }
      return ret;
    }
  };

  // src/boxes/co64.js
  var co64_default = {
    name: "Chunk Large Offset Box",
    description: "",
    parser(r) {
      const version = r.bytesToInt(1);
      if (version !== 0) {
        throw new Error("invalid version");
      }
      const flags = r.bytesToInt(3);
      const entry_count = r.bytesToInt(4);
      const chunk_offsets = [];
      for (let i = 0; i < entry_count; i++) {
        chunk_offsets.push(r.bytesToInt(8));
      }
      return {
        version,
        flags,
        entry_count,
        chunk_offsets
      };
    }
  };

  // src/boxes/ctts.js
  var ctts_default = {
    name: "Composition Time to Sample Box",
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
          sample_count: r.bytesToInt(4),
          sample_offset: version === 0 ? r.bytesToInt(4) : ~~r.bytesToInt(4)
        });
      }
      return {
        version,
        flags,
        entry_count,
        entries
      };
    }
  };

  // src/boxes/dinf.js
  var dinf_default = {
    name: "Data Information Box",
    description: "Objects that declare the location of the media information in a track.",
    container: true
  };

  // src/boxes/dref.js
  var dref_default = {
    name: "Data Reference Box",
    description: "",
    container: true,
    parser(reader) {
      const version = reader.bytesToInt(1);
      const flags = reader.bytesToInt(3);
      if (version !== 0) {
        throw new Error("invalid version");
      }
      if (flags !== 0) {
        throw new Error("invalid flags");
      }
      const entry_count = reader.bytesToInt(4);
      return { version, flags, entry_count };
    }
  };

  // src/boxes/edts.js
  var edts_default = {
    name: "Edit Box",
    description: "Maps the presentation time\u2010line to the media time\u2010line as it is stored in the file.",
    container: true
  };

  // src/boxes/elst.js
  var elst_default = {
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
          segment_duration: r.bytesToInt(version === 0 ? 4 : 8),
          media_time: version === 0 ? ~~r.bytesToInt(4) : r.bytesToInt(8),
          media_rate_integer: r.bytesToInt(2),
          media_rate_fraction: r.bytesToInt(2)
        });
      }
      return {
        version,
        flags,
        entry_count,
        entries
      };
    }
  };

  // src/boxes/esds.js
  var esds_default = {
    name: "Elementary Stream Descriptor Box",
    description: "",
    parser(r) {
      const version = r.bytesToInt(1);
      if (version !== 0) {
        throw new Error("invalid version");
      }
      const flags = r.bytesToInt(3);
      const descriptors = [];
      while (!r.isFinished()) {
        descriptors.push(parseDescriptor(r));
      }
      return {
        version,
        flags,
        descriptors
      };
    }
  };

  // src/boxes/free.js
  var free_default = {
    name: "Free Space Box",
    description: "This box can be completely ignored"
  };

  // src/boxes/ftyp.js
  var ftyp_default = {
    name: "File Type Box",
    description: "File type and compatibility",
    content: [
      {
        /* name: "major brand", */
        // optional name
        key: "major_brand",
        description: "Brand identifier."
      },
      {
        key: "minor_version",
        description: "informative integer for the minor version of the major brand"
      },
      {
        key: "compatible_brands",
        description: "List of brands"
      }
    ],
    parser(reader) {
      const len = reader.getTotalLength();
      const major_brand = reader.bytesToASCII(4);
      const minor_version = reader.bytesToInt(4);
      const compatArr = [];
      for (let i = 8; i < len; i += 4) {
        compatArr.push(reader.bytesToASCII(4));
      }
      return {
        major_brand,
        minor_version,
        compatible_brands: compatArr.join(", ")
      };
    }
  };

  // src/boxes/hdlr.js
  var hdlr_default = {
    name: "Handler Reference Box",
    description: "This box within a Media Box declares media type of the track, and thus the process by which the media\u2010data in the track is presented",
    parser(r) {
      const ret = {
        version: r.bytesToInt(1),
        flags: r.bytesToInt(3),
        pre_defined: r.bytesToInt(4),
        handler_type: r.bytesToInt(4),
        reserved: [r.bytesToInt(4), r.bytesToInt(4), r.bytesToInt(4)]
      };
      let remaining = r.getRemainingLength();
      ret.name = "";
      while (remaining--) {
        ret.name += String.fromCharCode(parseInt(r.bytesToInt(1), 10));
      }
      return ret;
    }
  };

  // src/boxes/hev1.js
  var hev1_default = {
    name: "HEV1 Sample Entry",
    description: "",
    container: true,
    parser(r) {
      return parseVisualSampleEntry(r);
    }
  };

  // src/boxes/hvc1.js
  var hvc1_default = {
    name: "HEVC Sample Entry",
    description: "",
    container: true,
    parser(r) {
      return parseVisualSampleEntry(r);
    }
  };

  // src/boxes/hvcC.js
  var hvcC_default = {
    name: "HEVC Decoder Configuration Record",
    description: "",
    parser(r) {
      const configurationVersion = r.bytesToInt(1);
      const generalProfileByte = r.bytesToInt(1);
      const generalCompatibilityFlagsUpper = r.bytesToInt(4);
      const generalLevelIdc = r.bytesToInt(1);
      const constraintUpper = r.bytesToInt(4);
      const constraintLower = r.bytesToInt(2);
      const minSpatialSegmentation = r.bytesToInt(2);
      const parallelismType = r.bytesToInt(1);
      const chromaFormat = r.bytesToInt(1);
      const bitDepthLumaMinus8 = r.bytesToInt(1);
      const bitDepthChromaMinus8 = r.bytesToInt(1);
      const avgFrameRate = r.bytesToInt(2);
      const miscByte = r.bytesToInt(1);
      const numOfArrays = r.bytesToInt(1);
      const arrays = [];
      for (let i = 0; i < numOfArrays; i++) {
        const arrayCompletenessByte = r.bytesToInt(1);
        const numNalus = r.bytesToInt(2);
        const nalus = [];
        for (let j = 0; j < numNalus; j++) {
          const nalUnitLength = r.bytesToInt(2);
          nalus.push({
            length: nalUnitLength,
            data: r.bytesToHex(nalUnitLength)
          });
        }
        arrays.push({
          array_completeness: !!(arrayCompletenessByte >> 7 & 1),
          reserved: !!(arrayCompletenessByte >> 6 & 1),
          NAL_unit_type: arrayCompletenessByte & 63,
          numNalus,
          nalus
        });
      }
      return {
        configurationVersion,
        general_profile_space: generalProfileByte >> 6 & 3,
        general_tier_flag: !!(generalProfileByte >> 5 & 1),
        general_profile_idc: generalProfileByte & 31,
        general_profile_compatibility_flags: generalCompatibilityFlagsUpper,
        general_constraint_indicator_flags: constraintUpper * 65536 + constraintLower,
        general_level_idc: generalLevelIdc,
        min_spatial_segmentation_idc: minSpatialSegmentation & 4095,
        parallelismType: parallelismType & 3,
        chromaFormat: chromaFormat & 3,
        bitDepthLumaMinus8: bitDepthLumaMinus8 & 7,
        bitDepthChromaMinus8: bitDepthChromaMinus8 & 7,
        avgFrameRate,
        constantFrameRate: miscByte >> 6 & 3,
        numTemporalLayers: miscByte >> 3 & 7,
        temporalIdNested: !!(miscByte >> 2 & 1),
        lengthSizeMinusOne: miscByte & 3,
        numOfArrays,
        arrays
      };
    }
  };

  // src/boxes/ilst.js
  var ilst_default = {
    name: "Item List Box",
    description: "",
    container: true
  };

  // src/boxes/iods.js
  var iods_default = {
    name: "Initial Object Descriptor Box"
  };

  // src/boxes/leva.js
  var leva_default = {
    name: "Level Assignment Box",
    // TODO
    parser(reader) {
      const version = reader.bytesToInt(1);
      const flags = reader.bytesToInt(3);
      return {
        version,
        flags
      };
    }
  };

  // src/boxes/mdat.js
  var mdat_default = {
    name: "Media Data Box",
    description: "the content's data"
  };

  // src/boxes/mdhd.js
  var mdhd_default = {
    name: "Media Header Box",
    description: "The media header declares overall information that is media\u2010independent, and relevant to characteristics of the media in a track.",
    parser(r) {
      const version = r.bytesToInt(1);
      const flags = r.bytesToInt(3);
      const creation_time = r.bytesToInt(version ? 8 : 4);
      const modification_time = r.bytesToInt(version ? 8 : 4);
      const timescale = r.bytesToInt(4);
      const duration = r.bytesToInt(version ? 8 : 4);
      const next2Bytes = r.bytesToInt(2);
      const pad = next2Bytes >> 15 & 1;
      const language = [
        String.fromCharCode((next2Bytes >> 10 & 31) + 96),
        String.fromCharCode((next2Bytes >> 5 & 31) + 96),
        String.fromCharCode((next2Bytes & 31) + 96)
      ].join("");
      const predifined = r.bytesToInt(2);
      return {
        version,
        flags,
        creation_time,
        modification_time,
        timescale,
        duration,
        pad,
        language,
        predifined
      };
    }
  };

  // src/boxes/mdia.js
  var mdia_default = {
    name: "Track Media Structure",
    description: "declare information about the media data within a track.",
    container: true
  };

  // src/boxes/mehd.js
  var mehd_default = {
    name: "Movie Extends Header Box",
    description: "Provides the overall duration, including fragments, of a fragmented movie. If this box is not present, the overall duration must be computed by examining each fragment.",
    parser(reader) {
      const version = reader.bytesToInt(1);
      if (version > 1) {
        throw new Error("invalid version");
      }
      const flags = reader.bytesToInt(3);
      const fragmentDuration = version === 1 ? reader.bytesToInt(8) : reader.bytesToInt(4);
      return {
        version,
        flags,
        fragment_duration: fragmentDuration
      };
    }
  };

  // src/boxes/meta.js
  var meta_default = {
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
        flags: r.bytesToInt(3)
      };
    }
  };

  // src/boxes/mfhd.js
  var mfhd_default = {
    name: "Movie Fragment Header Box",
    description: "This box contains just a sequence number (usually starting at 1), as a safety check.",
    parser(r) {
      return {
        version: r.bytesToInt(1),
        flags: r.bytesToInt(3),
        sequence_number: r.bytesToInt(4)
      };
    }
  };

  // src/boxes/minf.js
  var minf_default = {
    name: "Media Information Box",
    description: "This box contains all the objects that declare characteristic information of the media in the track.",
    container: true
  };

  // src/boxes/moof.js
  var moof_default = {
    name: "Movie Fragment Box",
    description: "",
    container: true
  };

  // src/boxes/moov.js
  var moov_default = {
    name: "Movie Box",
    description: "The movie metadata",
    container: true
  };

  // src/boxes/mp4a.js
  var mp4a_default = {
    name: "MPEG-4 Audio Sample Entry",
    description: "",
    container: true,
    parser(r) {
      return parseAudioSampleEntry(r);
    }
  };

  // src/boxes/mvex.js
  var mvex_default = {
    name: "Movie Extends Box",
    container: true
  };

  // src/boxes/mvhd.js
  var mvhd_default = {
    name: "Movie Header Box",
    description: "This box defines overall information which is media\u2010independent, and relevant to the entire presentation considered as a whole.",
    content: [
      {
        name: "version",
        description: "mvhd version",
        key: "version"
      },
      {
        name: "flags",
        description: "mvhd flags",
        key: "flags"
      },
      {
        name: "creation_time",
        description: "An integer that declares the creation time of the presentation (in seconds since midnight, Jan. 1, 1904, in UTC time)",
        key: "creationTime"
      },
      {
        name: "modification_time",
        description: "An integer that declares the most recent time the presentation was modified (in seconds since midnight, Jan. 1, 1904, in UTC time)",
        key: "modificationTime"
      },
      {
        name: "timescale",
        description: "An integer that specifies the time\u2010scale for the entire presentation; this is the number of time units that pass in one second. For example, a t me coordinate system that measures time in sixtieths of a second has a time scale of 60.",
        key: "timescale"
      },
      {
        name: "duration",
        description: "An integer that declares length of the presentation (in the indicated timescale). This property is derived from the presentation\u2019s tracks: the value of this field corresponds to the duration of the longest track in the presentation. If the durat ion cannot be determined then duration is set to all 1s.",
        key: "duration"
      },
      {
        name: "rate",
        description: "A fixed point 16.16 number that indicates the preferred rate to play the presentation; 1.0 (0x00010000) is normal forward playback ",
        key: "rate"
      },
      {
        name: "volume",
        description: "A fixed point 8.8 number that indicates the preferred playback volume. 1.0 (0x0100) is full volume.",
        key: "volume"
      },
      {
        name: "reserved 1",
        description: "Reserved 16 bits",
        key: "reserved1"
      },
      {
        name: "reserved 2",
        description: "Reserved 2*32 bits",
        key: "reserved2"
      },
      {
        name: "matrix",
        description: "Provides a transformation matrix for the video; (u,v,w) are  restricted here to (0,0,1), hex values (0,0,0x40000000).",
        key: "matrix"
      },
      {
        name: "pre-defined",
        description: "Pre-defined 32*6 bits.",
        key: "predefined"
      },
      {
        name: "next_track_ID",
        description: "A non\u2010zero integer that indicates a value to use for the track ID of the next track to be added to this presentation. Zero is not a valid track ID value. The value of next_track_ID shall be larger than the largest track\u2010ID in use. If this valu e is equal to all 1s (32\u2010bit maxint), and a new media track is to be added, then a search must be made in the file for an unused track identifier.",
        key: "nextTrackId"
      }
    ],
    parser: (reader) => {
      const version = reader.bytesToInt(1);
      if (version > 1) {
        throw new Error("invalid version");
      }
      const flags = reader.bytesToInt(3);
      let creationTime, modificationTime, timescale, duration;
      if (version === 1) {
        creationTime = reader.bytesToInt(8);
        modificationTime = reader.bytesToInt(8);
        timescale = reader.bytesToInt(4);
        duration = reader.bytesToInt(8);
      } else {
        creationTime = reader.bytesToInt(4);
        modificationTime = reader.bytesToInt(4);
        timescale = reader.bytesToInt(4);
        duration = reader.bytesToInt(4);
      }
      const rate = [reader.bytesToInt(2), reader.bytesToInt(2)].join(".");
      const volume = [reader.bytesToInt(1), reader.bytesToInt(1)].join(".");
      const reserved1 = reader.bytesToInt(2);
      const reserved2 = [reader.bytesToInt(4), reader.bytesToInt(4)];
      const matrixArr = [];
      for (let i = 0; i < 9; i++) {
        matrixArr.push(reader.bytesToInt(4));
      }
      const predefined = [
        reader.bytesToInt(4),
        reader.bytesToInt(4),
        reader.bytesToInt(4),
        reader.bytesToInt(4),
        reader.bytesToInt(4),
        reader.bytesToInt(4)
      ];
      const nextTrackId = reader.bytesToInt(4);
      return {
        version,
        flags,
        creationTime,
        modificationTime,
        timescale,
        duration,
        rate,
        volume,
        reserved1,
        reserved2,
        matrix: matrixArr,
        predefined,
        nextTrackId
      };
    }
  };

  // src/boxes/pdin.js
  var pdin_default = {
    name: "Progressive Download Information Box",
    description: "",
    content: [
      {
        name: "version",
        description: "pdin version",
        key: "version"
      },
      {
        name: "flags",
        description: "pdin flags",
        key: "flags"
      },
      {
        name: "rate",
        description: "Download rate expressed in bytes/second",
        key: "rate"
      },
      {
        name: "initial_delay",
        description: "Suggested delay to use when playing the file, such that if download continues at the given rate, all data within the file will arrive in time for its use and playback should not need to stall.",
        key: "delay"
      }
    ],
    parser(reader) {
      const version = reader.bytesToInt(1);
      if (version !== 0) {
        throw new Error("invalid version");
      }
      return {
        version,
        flags: reader.bytesToInt(3),
        rate: reader.bytesToInt(4),
        delay: reader.bytesToInt(4)
      };
    }
  };

  // src/boxes/pssh.js
  var SYSTEM_IDS = {
    "1077EFECC0B24D02ACE33C1E52E2FB4B": "cenc",
    "1F83E1E86EE94F0DBA2F5EC4E3ED1A66": "SecureMedia",
    "35BF197B530E42D78B651B4BF415070F": "DivX DRM",
    "45D481CB8FE049C0ADA9AB2D2455B2F2": "CoreCrypt",
    "5E629AF538DA4063897797FFBD9902D4": "Marlin",
    "616C7469636173742D50726F74656374": "AltiProtect",
    "644FE7B5260F4FAD949A0762FFB054B4": "CMLA",
    "69F908AF481646EA910CCD5DCCCB0A3A": "Marlin",
    "6A99532D869F59229A91113AB7B1E2F3": "MobiDRM",
    "80A6BE7E14484C379E70D5AEBE04C8D2": "Irdeto",
    "94CE86FB07FF4F43ADB893D2FA968CA2": "FairPlay",
    "992C46E6C4374899B6A050FA91AD0E39": "SteelKnot",
    "9A04F07998404286AB92E65BE0885F95": "PlayReady",
    "9A27DD82FDE247258CBC4234AA06EC09": "Verimatrix VCAS",
    A68129D3575B4F1A9CBA3223846CF7C3: "VideoGuard Everywhere",
    ADB41C242DBF4A6D958B4457C0D27B95: "Nagra",
    B4413586C58CFFB094A5D4896C1AF6C3: "Viaccess-Orca",
    DCF4E3E362F158187BA60A6FE33FF3DD: "DigiCAP",
    E2719D58A985B3C9781AB030AF78D30E: "ClearKey",
    EDEF8BA979D64ACEA3C827DCD51D21ED: "Widevine",
    F239E769EFA348509C16A903C6932EFB: "PrimeTime"
  };
  var pssh_default = {
    name: "Protection System Specific Header",
    description: "",
    parser(reader) {
      const ret = {};
      ret.version = reader.bytesToInt(1);
      if (ret.version > 1) {
        throw new Error("invalid version");
      }
      ret.flags = reader.bytesToInt(3);
      ret.systemID = reader.bytesToHex(16);
      const systemIDName = SYSTEM_IDS[ret.systemID];
      if (systemIDName) {
        ret.systemID += ` (${systemIDName})`;
      }
      if (ret.version === 1) {
        ret.KID_count = reader.bytesToInt(4);
        ret.KIDs = [];
        let i = ret.KID_count;
        while (i--) {
          ret.KIDs.push([reader.bytesToHex(16)]);
        }
      }
      ret.data_length = reader.bytesToInt(4);
      ret.data = reader.bytesToHex(ret.data_length);
      return ret;
    }
  };

  // src/boxes/saio.js
  var saio_default = {
    name: "Sample Auxiliary Information Offsets",
    description: "",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      if (ret.flags === 1) {
        ret.aux_info_type = r.bytesToInt(4);
        ret.aux_info_type_parameter = r.bytesToInt(4);
      }
      ret.entry_count = r.bytesToInt(4);
      ret.offset = [];
      let i = ret.entry_count;
      while (i--) {
        ret.offset.push(r.bytesToInt(ret.version === 0 ? 4 : 8));
      }
      return ret;
    }
  };

  // src/boxes/saiz.js
  var saiz_default = {
    name: "Sample Auxiliary Information Sizes",
    description: "",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      if (ret.flags === 1) {
        ret.aux_info_type = r.bytesToInt(4);
        ret.aux_info_type_parameter = r.bytesToInt(4);
      }
      ret.default_sample_info_size = r.bytesToInt(1);
      ret.sample_count = r.bytesToInt(4);
      if (ret.default_sample_info_size === 0) {
        ret.sample_info_size = [];
        let i = ret.sample_count;
        while (i--) {
          ret.sample_info_size.push(r.bytesToInt(1));
        }
      }
      return ret;
    }
  };

  // src/boxes/sdtp.js
  var sdtp_default = {
    name: "Independent and Disposable Samples Box",
    description: "",
    parser(r) {
      const ret = {
        version: r.bytesToInt(1),
        flags: r.bytesToInt(3)
      };
      const remaining = r.getRemainingLength();
      let i = remaining;
      ret.samples = [];
      while (i--) {
        const byte = r.bytesToInt(1);
        ret.samples.push({
          is_leading: byte >> 6 & 3,
          sample_depends_on: byte >> 4 & 3,
          sample_is_depended_on: byte >> 2 & 3,
          sample_has_redundancy: byte & 3
        });
      }
      return ret;
    }
  };

  // src/boxes/sidx.js
  var sidx_default = {
    name: "Segment Index Box",
    description: "Index of the media stream",
    parser(r) {
      const version = r.bytesToInt(1);
      const flags = r.bytesToInt(3);
      const reference_id = r.bytesToInt(4);
      const timescale = r.bytesToInt(4);
      const earliest_presentation_time = r.bytesToInt(version === 0 ? 4 : 8);
      const first_offset = r.bytesToInt(version === 0 ? 4 : 8);
      const reserved = r.bytesToInt(2);
      const reference_count = r.bytesToInt(2);
      const items = [];
      let i = reference_count;
      while (i--) {
        const first4Bytes = r.bytesToInt(4);
        const second4Bytes = r.bytesToInt(4);
        const third4Bytes = r.bytesToInt(4);
        items.push({
          reference_type: first4Bytes >> 31 & 1,
          referenced_size: first4Bytes & 2147483647,
          subsegment_duration: second4Bytes,
          starts_with_SAP: third4Bytes >> 31 & 1,
          SAP_type: third4Bytes >> 28 & 7,
          SAP_delta_time: third4Bytes & 268435455
        });
      }
      return {
        version,
        flags,
        reference_id,
        timescale,
        earliest_presentation_time,
        first_offset,
        reserved,
        reference_count,
        items
      };
    }
  };

  // src/boxes/skip.js
  var skip_default = {
    name: "Free Space Box",
    description: "This box can be completely ignored."
  };

  // src/boxes/smhd.js
  var smhd_default = {
    name: "Sound Media Header Box",
    description: "",
    parser(r) {
      const version = r.bytesToInt(1);
      if (version !== 0) {
        throw new Error("invalid version");
      }
      return {
        version,
        flags: r.bytesToInt(3),
        balance: toSignedInt(r.bytesToInt(2), 16) / 256,
        reserved: r.bytesToInt(2)
      };
    }
  };

  // src/boxes/stbl.js
  var stbl_default = {
    name: "Sample Table",
    description: "",
    container: true
  };

  // src/boxes/stco.js
  var stco_default = {
    name: "Chunk Offset",
    description: "",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      ret.entry_count = r.bytesToInt(4);
      ret.chunk_offsets = [];
      let i = ret.entry_count;
      while (i--) {
        ret.chunk_offsets.push(r.bytesToInt(4));
      }
      return ret;
    }
  };

  // src/boxes/stsc.js
  var stsc_default = {
    name: "Sample To Chunk",
    description: "",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      ret.entry_count = r.bytesToInt(4);
      ret.entries = [];
      let i = ret.entry_count;
      while (i--) {
        const e = {};
        e.first_chunk = r.bytesToInt(4);
        e.samples_per_chunk = r.bytesToInt(4);
        e.sample_description_index = r.bytesToInt(4);
        ret.entries.push(e);
      }
      return ret;
    }
  };

  // src/boxes/stsd.js
  var stsd_default = {
    name: "Sample Description",
    description: "Information about the coding type used",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      ret.entry_count = r.bytesToInt(4);
      return ret;
    },
    container: true
  };

  // src/boxes/stss.js
  var stss_default = {
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
        sample_numbers
      };
    }
  };

  // src/boxes/stsz.js
  var stsz_default = {
    name: "Sample Size",
    description: "",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      ret.sample_size = r.bytesToInt(4);
      ret.sample_count = r.bytesToInt(4);
      if (ret.sample_size === 0) {
        ret.entries = [];
        let i = ret.sample_count;
        while (i--) {
          ret.entries.push(r.bytesToInt(4));
        }
      }
      return ret;
    }
  };

  // src/boxes/stts.js
  var stts_default = {
    name: "Decoding Time to Sample",
    description: "",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      ret.entry_count = r.bytesToInt(4);
      ret.entries = [];
      let i = ret.entry_count;
      while (i--) {
        const e = {};
        e.sample_count = r.bytesToInt(4);
        e.sample_delta = r.bytesToInt(4);
        ret.entries.push(e);
      }
      return ret;
    }
  };

  // src/boxes/styp.js
  var styp_default = {
    name: "Segment Type Box",
    description: "",
    content: ftyp_default.content,
    parser: ftyp_default.parser
  };

  // src/boxes/tfdt.js
  var tfdt_default = {
    name: "Track Fragment Decode Time",
    description: "The absolute decode time, measured on the media timeline, of the first sample in decode order in the track fragment",
    parser(r) {
      const version = r.bytesToInt(1);
      return {
        version,
        flags: r.bytesToInt(3),
        baseMediaDecodeTime: r.bytesToInt(version ? 8 : 4)
      };
    }
  };

  // src/boxes/tfhd.js
  var tfhd_default = {
    name: "Track Fragment Header Box",
    description: "",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      const flags = r.bytesToInt(3);
      const hasBaseDataOffset = flags & 1;
      const hasSampleDescriptionIndex = flags & 2;
      const hasDefaultSampleDuration = flags & 8;
      const hasDefaultSampleSize = flags & 16;
      const hasDefaultSampleFlags = flags & 32;
      const durationIsEmpty = flags & 65536;
      const defaultBaseIsMOOF = flags & 131072;
      ret.flags = {
        "base-data-offset-present": !!hasBaseDataOffset,
        "sample-description-index-present": !!hasSampleDescriptionIndex,
        "default-sample-duration-present": !!hasDefaultSampleDuration,
        "default-sample-size-present": !!hasDefaultSampleSize,
        "default-sample-flags-present": !!hasDefaultSampleFlags,
        "duration-is-empty": !!durationIsEmpty,
        "default-base-is-moof": !!defaultBaseIsMOOF
      };
      ret.track_ID = r.bytesToInt(4);
      if (hasBaseDataOffset) {
        ret.base_data_offset = r.bytesToInt(8);
      }
      if (hasSampleDescriptionIndex) {
        ret.sample_description_index = r.bytesToInt(4);
      }
      if (hasDefaultSampleDuration) {
        ret.default_sample_duration = r.bytesToInt(4);
      }
      if (hasDefaultSampleSize) {
        ret.default_sample_size = r.bytesToInt(4);
      }
      if (hasDefaultSampleFlags) {
        ret.default_sample_flags = r.bytesToInt(4);
      }
      return ret;
    }
  };

  // src/boxes/tkhd.js
  var tkhd_default = {
    name: "Track Header Box",
    description: "Characteristics of a single track.",
    parser(r) {
      const version = r.bytesToInt(1);
      return {
        version,
        flags: r.bytesToInt(3),
        creation_time: r.bytesToInt(version ? 8 : 4),
        modification_time: r.bytesToInt(version ? 8 : 4),
        track_ID: r.bytesToInt(4),
        reserved1: r.bytesToInt(4),
        duration: r.bytesToInt(version ? 8 : 4),
        reserved2: [r.bytesToInt(4), r.bytesToInt(4)],
        // TODO template? signed?
        layer: r.bytesToInt(2),
        alternate_group: r.bytesToInt(2),
        volume: [r.bytesToInt(1), r.bytesToInt(1)].join("."),
        reserved3: r.bytesToInt(2),
        matrix: [
          r.bytesToInt(4),
          r.bytesToInt(4),
          r.bytesToInt(4),
          r.bytesToInt(4),
          r.bytesToInt(4),
          r.bytesToInt(4),
          r.bytesToInt(4),
          r.bytesToInt(4),
          r.bytesToInt(4)
        ],
        width: [r.bytesToInt(2), r.bytesToInt(2)],
        height: [r.bytesToInt(2), r.bytesToInt(2)]
      };
    }
  };

  // src/boxes/traf.js
  var traf_default = {
    name: "Track Fragment Box",
    description: "",
    container: true
  };

  // src/boxes/trak.js
  var trak_default = {
    name: "Track Box",
    description: "Container box for a single track of a presentation. A presentation consists of one or more tracks. Each track is independent of the other tracks in the presentation and carries its own temporal and spatial information. Each track will contain its associated Media Box.",
    container: true
  };

  // src/boxes/trex.js
  var trex_default = {
    name: "Track Extends Box",
    description: "sets up default values used by the movie fragments. By setting defaults in this way, space and complexity can be saved in each Track Fragment Box",
    parser(reader) {
      return {
        version: reader.bytesToInt(1),
        flags: reader.bytesToInt(3),
        track_id: reader.bytesToInt(4),
        default_sample_description_index: reader.bytesToInt(4),
        default_sample_duration: reader.bytesToInt(4),
        default_sample_size: reader.bytesToInt(4),
        default_sample_flags: reader.bytesToInt(4)
      };
    }
  };

  // src/boxes/trun.js
  var trun_default = {
    name: "Track Fragment Run Box",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      const flags = r.bytesToInt(3);
      const hasDataOffset = flags & 1;
      const hasFirstSampleFlags = flags & 4;
      const hasSampleDuration = flags & 256;
      const hasSampleSize = flags & 512;
      const hasSampleFlags = flags & 1024;
      const hasSampleCompositionOffset = flags & 2048;
      ret.flags = {
        "data-offset-present": !!hasDataOffset,
        "first-sample-flags-present": !!hasFirstSampleFlags,
        "sample-duration-present": !!hasSampleDuration,
        "sample-size-present": !!hasSampleSize,
        "sample-flags-present": !!hasSampleFlags,
        "sample-composition-time-offset-present": !!hasSampleCompositionOffset
      };
      ret.sample_count = r.bytesToInt(4);
      if (hasDataOffset) {
        ret.data_offset = ~~r.bytesToInt(4);
      }
      if (hasFirstSampleFlags) {
        ret.first_sample_flags = r.bytesToInt(4);
      }
      let i = ret.sample_count;
      ret.samples = [];
      while (i--) {
        const sample = {};
        if (hasSampleDuration) {
          sample.sample_duration = r.bytesToInt(4);
        }
        if (hasSampleSize) {
          sample.sample_size = r.bytesToInt(4);
        }
        if (hasSampleFlags) {
          sample.sample_flags = r.bytesToInt(4);
        }
        if (hasSampleCompositionOffset) {
          sample.sample_composition_time_offset = ret.version === 0 ? r.bytesToInt(4) : ~~r.bytesToInt(4);
        }
        ret.samples.push(sample);
      }
      return ret;
    }
  };

  // src/boxes/udta.js
  var udta_default = {
    name: "User Data Box",
    description: "",
    container: true
  };

  // src/boxes/url .js
  var url_default = {
    name: "Data Entry Url Box",
    description: "declare the location(s) of the media data used within the presentation.",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      const remaining = r.getRemainingLength();
      if (remaining) {
        ret.location = String.fromCharCode.apply(
          String,
          r.bytesToInt(r.getRemainingLength())
        );
      }
      return ret;
    }
  };

  // src/boxes/urn .js
  var urn_default = {
    name: "Data Entry Url Box",
    description: "declare the location(s) of the media data used within the presentation.",
    parser(r) {
      const ret = {};
      ret.version = r.bytesToInt(1);
      ret.flags = r.bytesToInt(3);
      const remaining = r.getRemainingLength();
      if (remaining) {
        ret.name = String.fromCharCode.apply(
          String,
          r.bytesToInt(r.getRemainingLength())
        );
      }
      return ret;
    }
  };

  // src/boxes/uuid.js
  var uuid_default = {
    name: "User-defined Box",
    description: "Custom box. Those are not yet parsed here."
  };

  // src/boxes/vmhd.js
  var vmhd_default = {
    name: "Video Media Header",
    description: "The video media header contains general presentation information, independent of the coding, for video media.",
    parser(reader) {
      const version = reader.bytesToInt(1);
      const flags = reader.bytesToInt(3);
      if (version !== 0) {
        throw new Error("invalid version");
      }
      if (flags !== 1) {
        throw new Error("invalid flags");
      }
      const graphicsmode = reader.bytesToInt(2);
      const opcolor = [
        reader.bytesToInt(2),
        reader.bytesToInt(2),
        reader.bytesToInt(2)
      ];
      return { version, flags, graphicsmode, opcolor };
    }
  };

  // src/boxes/index.js
  var boxes_default = {
    avc1: avc1_default,
    avc3: avc3_default,
    avcC: avcC_default,
    co64: co64_default,
    ctts: ctts_default,
    dinf: dinf_default,
    dref: dref_default,
    edts: edts_default,
    elst: elst_default,
    esds: esds_default,
    free: free_default,
    ftyp: ftyp_default,
    hdlr: hdlr_default,
    hev1: hev1_default,
    hvc1: hvc1_default,
    hvcC: hvcC_default,
    iods: iods_default,
    ilst: ilst_default,
    leva: leva_default,
    mdat: mdat_default,
    mdhd: mdhd_default,
    mdia: mdia_default,
    mehd: mehd_default,
    meta: meta_default,
    mfhd: mfhd_default,
    minf: minf_default,
    moof: moof_default,
    moov: moov_default,
    mp4a: mp4a_default,
    mvex: mvex_default,
    mvhd: mvhd_default,
    pdin: pdin_default,
    pssh: pssh_default,
    saio: saio_default,
    saiz: saiz_default,
    sdtp: sdtp_default,
    sidx: sidx_default,
    smhd: smhd_default,
    skip: skip_default,
    stbl: stbl_default,
    stco: stco_default,
    stsc: stsc_default,
    stsd: stsd_default,
    stss: stss_default,
    stsz: stsz_default,
    stts: stts_default,
    styp: styp_default,
    tfdt: tfdt_default,
    tfhd: tfhd_default,
    tkhd: tkhd_default,
    traf: traf_default,
    trak: trak_default,
    trex: trex_default,
    trun: trun_default,
    udta: udta_default,
    "url ": url_default,
    "urn ": urn_default,
    uuid: uuid_default,
    vmhd: vmhd_default
  };

  // src/utils/bytes.js
  function be2toi(bytes, off) {
    return (bytes[0 + off] << 8) + bytes[1 + off];
  }
  function be3toi(bytes, off) {
    return bytes[0 + off] * 65536 + bytes[1 + off] * 256 + bytes[2 + off];
  }
  function be4toi(bytes, off) {
    return bytes[0 + off] * 16777216 + bytes[1 + off] * 65536 + bytes[2 + off] * 256 + bytes[3 + off];
  }
  function be5toi(bytes, off) {
    return bytes[0 + off] * 4294967296 + bytes[1 + off] * 16777216 + bytes[2 + off] * 65536 + bytes[3 + off] * 256 + bytes[4 + off];
  }
  function be8toi(bytes, off) {
    return (bytes[0 + off] * 16777216 + bytes[1 + off] * 65536 + bytes[2 + off] * 256 + bytes[3 + off]) * 4294967296 + bytes[4 + off] * 16777216 + bytes[5 + off] * 65536 + bytes[6 + off] * 256 + bytes[7 + off];
  }
  function bytesToHex(uint8arr, off, nbBytes) {
    if (!uint8arr) {
      return "";
    }
    const arr = uint8arr.slice(off, nbBytes + off);
    let hexStr = "";
    for (let i = 0; i < arr.length; i++) {
      let hex = (arr[i] & 255).toString(16);
      hex = hex.length === 1 ? `0${hex}` : hex;
      hexStr += hex;
    }
    return hexStr.toUpperCase();
  }
  function betoa(uint8arr, off, nbBytes) {
    if (!uint8arr) {
      return "";
    }
    const arr = uint8arr.slice(off, nbBytes + off);
    return String.fromCharCode.apply(String, arr);
  }

  // src/utils/buffer_reader.js
  function createBufferReader(buffer) {
    let currentOffset = 0;
    return {
      /**
       * Returns the following byte, as a number between 0 and 255.
       * @returns {number}
       */
      getNextByte() {
        this.getNextBytes(1);
      },
      /**
       * Returns the N next bytes, as an Uint8Array
       * @param {number} nb
       * @returns {Uint8Array}
       */
      getNextBytes(nb) {
        if (this.getRemainingLength() < nb) {
          return;
        }
        currentOffset += nb;
        return buffer.slice(0, nb);
      },
      /**
       * Returns the N next bytes, as a single number.
       *
       * /!\ only work for now for 1, 2, 3, 4, 5 or 8 bytes.
       * TODO Define a more global solution.
       *
       * /!\ Depending on the size of the number, it may be larger than JS'
       * limit.
       *
       * @param {number} nb
       * @returns {number}
       */
      bytesToInt(nbBytes) {
        if (this.getRemainingLength() < nbBytes) {
          return;
        }
        let res;
        switch (nbBytes) {
          case 1:
            res = buffer[currentOffset];
            break;
          case 2:
            res = be2toi(buffer, currentOffset);
            break;
          case 3:
            res = be3toi(buffer, currentOffset);
            break;
          case 4:
            res = be4toi(buffer, currentOffset);
            break;
          case 5:
            res = be5toi(buffer, currentOffset);
            break;
          case 8:
            res = be8toi(buffer, currentOffset);
            break;
          default:
            throw new Error("not implemented yet.");
        }
        currentOffset += nbBytes;
        return res;
      },
      /**
       * Returns the N next bytes into a string of Hexadecimal values.
       * @param {number}
       * @returns {string}
       */
      bytesToHex(nbBytes) {
        if (this.getRemainingLength() < nbBytes) {
          return;
        }
        const res = bytesToHex(buffer, currentOffset, nbBytes);
        currentOffset += nbBytes;
        return res;
      },
      /**
       * Returns the N next bytes into a string.
       * @param {number}
       * @returns {string}
       */
      bytesToASCII(nbBytes) {
        if (this.getRemainingLength() < nbBytes) {
          return;
        }
        const res = betoa(buffer, currentOffset, nbBytes);
        currentOffset += nbBytes;
        return res;
      },
      /**
       * Returns the total length of the buffer
       * @returns {number}
       */
      getTotalLength() {
        return buffer.length;
      },
      /**
       * Returns the length of the buffer which is not yet parsed.
       * @returns {number}
       */
      getRemainingLength() {
        return Math.max(0, buffer.length - currentOffset);
      },
      /**
       * Returns true if this buffer is entirely parsed.
       * @returns {boolean}
       */
      isFinished() {
        return buffer.length <= currentOffset;
      }
    };
  }

  // src/main.js
  function recursiveParseBoxes(arr) {
    let i = 0;
    const returnedArray = [];
    while (i < arr.length) {
      let currentOffset = i;
      let size = be4toi(arr, currentOffset);
      currentOffset += 4;
      if (size === 1) {
        size = be8toi(arr, currentOffset);
        currentOffset += 8;
      } else if (size === 0) {
        size = arr.length - i;
      }
      const name = betoa(arr, currentOffset, 4);
      currentOffset += 4;
      const atomObject = {
        alias: name,
        size,
        values: []
      };
      if (name === "uuid") {
        const subtype = [];
        let j = 16;
        while (j--) {
          subtype.push(arr[currentOffset]);
          currentOffset += 1;
        }
        atomObject.subtype = subtype;
      }
      returnedArray.push(atomObject);
      if (boxes_default[name]) {
        const config = boxes_default[name];
        const contentInfos = config.content ? config.content.reduce((acc, el) => {
          acc[el.key] = {
            name: el.name || "",
            description: el.description | ""
          };
          return acc;
        }, {}) : { name: "", description: "" };
        atomObject.name = config.name || "";
        atomObject.description = config.description || "";
        const hasChildren = !!config.container;
        const content = arr.slice(currentOffset, size + i);
        let contentForChildren;
        if (typeof config.parser === "function") {
          const parserReader = createBufferReader(content);
          let result = {};
          try {
            result = config.parser(parserReader);
          } catch (e) {
            console.warn(`impossible to parse "${name}" box.`, e);
          }
          if (hasChildren) {
            const remaining = parserReader.getRemainingLength();
            contentForChildren = content.slice(content.length - remaining);
          } else if (!parserReader.isFinished()) {
            console.warn(
              `not everything has been parsed for box: ${name}. Missing`,
              parserReader.getRemainingLength(),
              "bytes."
            );
          }
          delete result.__data__;
          Object.keys(result).forEach((key) => {
            const infos = contentInfos[key] || {};
            if (!infos.name) {
              infos.name = key;
            }
            atomObject.values.push(
              Object.assign(
                {
                  value: result[key]
                },
                infos
              )
            );
          });
        }
        if (hasChildren) {
          const childrenResult = parseBoxes(contentForChildren || content);
          atomObject.children = childrenResult;
        }
      }
      i += size;
    }
    return returnedArray;
  }
  function parseBoxes(arr) {
    if (arr instanceof Uint8Array) {
      return recursiveParseBoxes(arr);
    }
    if (arr instanceof ArrayBuffer) {
      return recursiveParseBoxes(new Uint8Array(arr));
    }
    if (arr.buffer instanceof ArrayBuffer) {
      return recursiveParseBoxes(new Uint8Array(arr.buffer));
    }
    throw new Error(
      "Unrecognized format. Please give an ArrayBuffer or TypedArray instead."
    );
  }
  return __toCommonJS(main_exports);
})();

  const bundleValue = __inspectISOBMFFBundle;
  return (bundleValue && bundleValue.default) || bundleValue;
});
