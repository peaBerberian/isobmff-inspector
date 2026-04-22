import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import definitions from "../src/boxes/index.js";
import { parseBuffer } from "../src/main.js";

const SUPPORTED_ALIASES = new Set(Object.keys(definitions));
const MP4_DIR = new URL("./fixtures/mp4s/", import.meta.url);

test("parse issues are returned on boxes without console warnings", () => {
  const warn = console.warn;
  let warnCount = 0;
  console.warn = () => {
    warnCount++;
  };

  try {
    const parsed = parseBuffer(
      new Uint8Array([
        0x00, 0x00, 0x00, 0x10, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x36,
      ]),
    );

    assert.equal(warnCount, 0);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].type, "ftyp");
    assert.deepEqual(
      parsed[0].issues.map((issue) => issue.severity),
      ["error", "error"],
    );
    assert.match(parsed[0].issues[0].message, /Truncated box/);
    assert.match(parsed[0].issues[1].message, /Cannot read 4 byte/);
  } finally {
    console.warn = warn;
  }
});

function parseDump(text) {
  const root = [];
  const stack = [];

  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "") {
      continue;
    }

    const indent = line.match(/^ */)[0].length / 2;
    const trimmed = line.trim();

    if (trimmed.startsWith("[")) {
      const closeBracketIndex = trimmed.indexOf("]");
      const alias = trimmed.slice(1, closeBracketIndex);
      const metadata = trimmed.slice(closeBracketIndex + 1).trim();
      const attrs = {};

      for (const match of metadata.matchAll(/([A-Za-z_]+)=([^,]+)/g)) {
        attrs[match[1]] = match[2].trim();
      }

      const node = {
        alias,
        attrs,
        props: {},
        rawChildren: [],
        children: [],
      };

      if (indent === 0) {
        root.push(node);
      } else {
        stack[indent - 1].rawChildren.push(node);
      }

      stack[indent] = node;
      stack.length = indent + 1;
      continue;
    }

    const separator = trimmed.indexOf(" = ");
    if (separator < 0 || indent === 0) {
      continue;
    }

    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 3);
    const parent = stack[indent - 1];
    parent.props[key] ||= [];
    parent.props[key].push(value);
  }

  return root;
}

function keepSupportedDumpSubtree(nodes) {
  return nodes
    .map((node) => {
      if (!SUPPORTED_ALIASES.has(node.alias)) {
        return null;
      }

      return {
        ...node,
        children: keepSupportedDumpSubtree(node.rawChildren),
      };
    })
    .filter(Boolean);
}

function normalizeActual(nodes) {
  return nodes
    .filter((node) => SUPPORTED_ALIASES.has(node.type))
    .map((node) => ({
      type: node.type,
      size: node.size,
      values: Object.fromEntries(
        node.values.map((value) => [value.key, unwrapParsedField(value)]),
      ),
      children: normalizeActual(node.children || []),
    }));
}

function unwrapParsedField(field) {
  if (!field || typeof field !== "object" || typeof field.kind !== "string") {
    return field;
  }

  if (field.kind === "array") {
    return field.items.map(unwrapParsedField);
  }
  if (field.kind === "struct") {
    if (field.layout === "iso-639-2-t") {
      const values = Object.fromEntries(
        field.fields.map((value) => [value.key, unwrapParsedField(value)]),
      );
      return values.value;
    }
    return Object.fromEntries(
      field.fields.map((value) => [value.key, unwrapParsedField(value)]),
    );
  }

  return field.value;
}

function dumpScalar(node, key) {
  return node.props[key]?.[0];
}

function dumpList(node, key) {
  return node.props[key] || [];
}

function dumpInteger(raw) {
  if (raw === undefined) {
    return undefined;
  }
  return /^[0-9]+$/.test(raw) ? Number(raw) : Number.parseInt(raw, 16);
}

function dumpBigInt(raw) {
  if (raw === undefined) {
    return undefined;
  }
  return /^-?[0-9]+$/.test(raw) ? BigInt(raw) : BigInt(`0x${raw}`);
}

function dumpFloat(raw) {
  return Number.parseFloat(raw);
}

function dumpHex(raw) {
  if (raw === undefined) {
    return undefined;
  }
  return Number.parseInt(raw, 16);
}

function dumpBoxSize(raw) {
  if (raw === undefined) {
    return undefined;
  }

  const parts = raw.split("+").map((part) => Number.parseInt(part, 10));
  if (parts.some(Number.isNaN)) {
    return undefined;
  }

  return parts.reduce((acc, part) => acc + part, 0);
}

function normalizeHexDump(raw) {
  return raw.replace(/[[\]\s]/g, "").toUpperCase();
}

function findRawChild(node, alias) {
  return node.rawChildren.find((child) => child.alias === alias);
}

const FIELD_CHECKS = {
  ftyp(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.major_brand.trimEnd(),
      dumpScalar(dumpNode, "major_brand"),
    );
    assert.equal(
      actualNode.values.minor_version,
      dumpInteger(dumpScalar(dumpNode, "minor_version")),
    );
    assert.deepEqual(
      actualNode.values.compatible_brands.split(", "),
      dumpList(dumpNode, "compatible_brand"),
    );
  },

  mvhd(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.timescale,
      dumpInteger(dumpScalar(dumpNode, "timescale")),
    );
    assert.equal(
      actualNode.values.duration,
      actualNode.values.version === 1
        ? dumpBigInt(dumpScalar(dumpNode, "duration"))
        : dumpInteger(dumpScalar(dumpNode, "duration")),
    );
  },

  mehd(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.fragment_duration,
      actualNode.values.version === 1
        ? dumpBigInt(dumpScalar(dumpNode, "duration"))
        : dumpInteger(dumpScalar(dumpNode, "duration")),
    );
  },

  trex(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.track_ID,
      dumpInteger(dumpScalar(dumpNode, "track id")),
    );
    assert.equal(
      actualNode.values.default_sample_description_index,
      dumpInteger(dumpScalar(dumpNode, "default sample description index")),
    );
    assert.equal(
      actualNode.values.default_sample_duration,
      dumpInteger(dumpScalar(dumpNode, "default sample duration")),
    );
    assert.equal(
      actualNode.values.default_sample_size,
      dumpInteger(dumpScalar(dumpNode, "default sample size")),
    );
    assert.equal(
      actualNode.values.default_sample_flags,
      dumpHex(dumpScalar(dumpNode, "default sample flags")),
    );
  },

  tkhd(dumpNode, actualNode) {
    assert.equal(actualNode.values.flags, dumpInteger(dumpNode.attrs.flags));
    assert.equal(
      actualNode.values.track_ID,
      dumpInteger(dumpScalar(dumpNode, "id")),
    );
    assert.equal(
      actualNode.values.duration,
      actualNode.values.version === 1
        ? dumpBigInt(dumpScalar(dumpNode, "duration"))
        : dumpInteger(dumpScalar(dumpNode, "duration")),
    );
    assert.equal(
      actualNode.values.width,
      dumpFloat(dumpScalar(dumpNode, "width")),
    );
    assert.equal(
      actualNode.values.height,
      dumpFloat(dumpScalar(dumpNode, "height")),
    );
  },

  elst(dumpNode, actualNode) {
    const entries = actualNode.values.entries;
    assert.equal(
      actualNode.values.entry_count,
      dumpInteger(dumpScalar(dumpNode, "entry_count")),
    );
    assert.equal(entries.length, actualNode.values.entry_count);
    assert.deepEqual(
      entries.map((entry) => entry.segment_duration),
      dumpList(dumpNode, "entry/segment duration").map(
        actualNode.values.version === 1 ? dumpBigInt : dumpInteger,
      ),
    );
    assert.deepEqual(
      entries.map((entry) => entry.media_time),
      dumpList(dumpNode, "entry/media time").map(
        actualNode.values.version === 1 ? dumpBigInt : dumpInteger,
      ),
    );
    assert.deepEqual(
      entries.map((entry) => entry.media_rate_integer),
      dumpList(dumpNode, "entry/media rate").map(dumpInteger),
    );
  },

  mdhd(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.timescale,
      dumpInteger(dumpScalar(dumpNode, "timescale")),
    );
    assert.equal(
      actualNode.values.duration,
      actualNode.values.version === 1
        ? dumpBigInt(dumpScalar(dumpNode, "duration"))
        : dumpInteger(dumpScalar(dumpNode, "duration")),
    );
    assert.equal(actualNode.values.language, dumpScalar(dumpNode, "language"));
  },

  vmhd(dumpNode, actualNode) {
    assert.equal(actualNode.values.flags, dumpInteger(dumpNode.attrs.flags));
    assert.equal(
      actualNode.values.graphicsmode,
      dumpInteger(dumpScalar(dumpNode, "graphics_mode")),
    );
  },

  dref(dumpNode, actualNode) {
    if (dumpScalar(dumpNode, "entry_count") !== undefined) {
      assert.equal(
        actualNode.values.entry_count,
        dumpInteger(dumpScalar(dumpNode, "entry_count")),
      );
    }
  },

  smhd(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.balance,
      dumpFloat(dumpScalar(dumpNode, "balance")),
    );
  },

  stsd(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.entry_count,
      dumpInteger(dumpScalar(dumpNode, "entry_count")),
    );
  },

  avc1(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.data_reference_index,
      dumpInteger(dumpScalar(dumpNode, "data_reference_index")),
    );
    assert.equal(
      actualNode.values.width,
      dumpInteger(dumpScalar(dumpNode, "width")),
    );
    assert.equal(
      actualNode.values.height,
      dumpInteger(dumpScalar(dumpNode, "height")),
    );
    if (dumpScalar(dumpNode, "compressor") !== undefined) {
      assert.equal(
        actualNode.values.compressorname,
        dumpScalar(dumpNode, "compressor"),
      );
    }
  },

  enca(dumpNode, actualNode) {
    FIELD_CHECKS.mp4a(dumpNode, actualNode);
  },

  encv(dumpNode, actualNode) {
    FIELD_CHECKS.avc1(dumpNode, actualNode);
  },

  avcC(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.configurationVersion,
      dumpInteger(dumpScalar(dumpNode, "Configuration Version")),
    );
    assert.equal(
      actualNode.values.lengthSizeMinusOne + 1,
      dumpInteger(dumpScalar(dumpNode, "NALU Length Size")),
    );
    assert.deepEqual(
      actualNode.values.sequenceParameterSets.map((entry) => entry.data),
      dumpList(dumpNode, "Sequence Parameter").map(normalizeHexDump),
    );
    assert.deepEqual(
      actualNode.values.pictureParameterSets.map((entry) => entry.data),
      dumpList(dumpNode, "Picture Parameter").map(normalizeHexDump),
    );
  },

  mp4a(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.data_reference_index,
      dumpInteger(dumpScalar(dumpNode, "data_reference_index")),
    );
    assert.equal(
      actualNode.values.channelcount,
      dumpInteger(dumpScalar(dumpNode, "channel_count")),
    );
    assert.equal(
      actualNode.values.samplesize,
      dumpInteger(dumpScalar(dumpNode, "sample_size")),
    );
    assert.equal(
      actualNode.values.samplerate,
      dumpFloat(dumpScalar(dumpNode, "sample_rate")),
    );
  },

  frma(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.original_format,
      dumpScalar(dumpNode, "original_format"),
    );
  },

  schm(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.scheme_type,
      dumpScalar(dumpNode, "scheme_type"),
    );
    assert.equal(
      actualNode.values.scheme_version,
      dumpInteger(dumpScalar(dumpNode, "scheme_version")),
    );
  },

  tenc(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.default_IsProtected,
      dumpInteger(dumpScalar(dumpNode, "default_isProtected")),
    );
    assert.equal(
      actualNode.values.default_Per_Sample_IV_Size,
      dumpInteger(dumpScalar(dumpNode, "default_Per_Sample_IV_Size")),
    );
    assert.equal(
      actualNode.values.default_KID,
      normalizeHexDump(dumpScalar(dumpNode, "default_KID")),
    );
  },

  esds(dumpNode, actualNode) {
    const esDescriptor = findRawChild(dumpNode, "ESDescriptor");
    const decoderConfig = findRawChild(esDescriptor, "DecoderConfig");
    const descriptors = actualNode.values.descriptors;
    assert.equal(descriptors.length, 1);
    assert.equal(
      descriptors[0].payload.es_id,
      dumpInteger(dumpScalar(esDescriptor, "es_id")),
    );
    assert.equal(
      descriptors[0].payload.stream_priority,
      dumpInteger(dumpScalar(esDescriptor, "stream_priority")),
    );

    const decoder = descriptors[0].payload.descriptors.find(
      (entry) => entry.tag === 4,
    );
    assert.equal(
      decoder.payload.stream_type,
      dumpInteger(dumpScalar(decoderConfig, "stream_type")),
    );
    assert.equal(
      decoder.payload.object_type_indication,
      dumpInteger(dumpScalar(decoderConfig, "object_type")),
    );
    assert.equal(
      decoder.payload.max_bitrate,
      dumpInteger(dumpScalar(decoderConfig, "max_bitrate")),
    );
    assert.equal(
      decoder.payload.avg_bitrate,
      dumpInteger(dumpScalar(decoderConfig, "avg_bitrate")),
    );
    assert.equal(
      decoder.payload.buffer_size_db,
      dumpInteger(dumpScalar(decoderConfig, "buffer_size")),
    );

    const decoderSpecificInfo = decoder.payload.descriptors.find(
      (entry) => entry.tag === 5,
    );
    assert.equal(
      decoderSpecificInfo.payload.decoder_specific_info,
      normalizeHexDump(dumpScalar(decoderConfig, "DecoderSpecificInfo")),
    );
  },

  stts(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.entry_count,
      dumpInteger(dumpScalar(dumpNode, "entry_count")),
    );
  },

  stsc(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.entry_count,
      dumpInteger(dumpScalar(dumpNode, "entry_count")),
    );
  },

  stsz(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.sample_size,
      dumpInteger(dumpScalar(dumpNode, "sample_size")),
    );
    assert.equal(
      actualNode.values.sample_count,
      dumpInteger(dumpScalar(dumpNode, "sample_count")),
    );
  },

  stco(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.entry_count,
      dumpInteger(dumpScalar(dumpNode, "entry_count")),
    );
  },

  mfhd(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.sequence_number,
      dumpInteger(dumpScalar(dumpNode, "sequence number")),
    );
  },

  tfhd(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.track_ID,
      dumpInteger(dumpScalar(dumpNode, "track ID")),
    );
    if (dumpScalar(dumpNode, "sample description index") !== undefined) {
      assert.equal(
        actualNode.values.sample_description_index,
        dumpInteger(dumpScalar(dumpNode, "sample description index")),
      );
    }
    if (dumpScalar(dumpNode, "default sample duration") !== undefined) {
      assert.equal(
        actualNode.values.default_sample_duration,
        dumpInteger(dumpScalar(dumpNode, "default sample duration")),
      );
    }
    if (dumpScalar(dumpNode, "default sample size") !== undefined) {
      assert.equal(
        actualNode.values.default_sample_size,
        dumpInteger(dumpScalar(dumpNode, "default sample size")),
      );
    }
    if (dumpScalar(dumpNode, "default sample flags") !== undefined) {
      assert.equal(
        actualNode.values.default_sample_flags,
        dumpHex(dumpScalar(dumpNode, "default sample flags")),
      );
    }
  },

  tfdt(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.baseMediaDecodeTime,
      actualNode.values.version === 1
        ? dumpBigInt(dumpScalar(dumpNode, "base media decode time"))
        : dumpInteger(dumpScalar(dumpNode, "base media decode time")),
    );
  },

  trun(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.sample_count,
      dumpInteger(dumpScalar(dumpNode, "sample count")),
    );
    if (dumpScalar(dumpNode, "data offset") !== undefined) {
      assert.equal(
        actualNode.values.data_offset,
        dumpInteger(dumpScalar(dumpNode, "data offset")),
      );
    }
  },

  sidx(dumpNode, actualNode) {
    assert.equal(
      actualNode.values.reference_ID,
      dumpInteger(dumpScalar(dumpNode, "reference_ID")),
    );
    assert.equal(
      actualNode.values.timescale,
      dumpInteger(dumpScalar(dumpNode, "timescale")),
    );
    assert.equal(
      actualNode.values.earliest_presentation_time,
      dumpInteger(dumpScalar(dumpNode, "earliest_presentation_time")),
    );
    assert.equal(
      actualNode.values.first_offset,
      dumpInteger(dumpScalar(dumpNode, "first_offset")),
    );
  },
};

function compareNodes(expectedNodes, actualNodes, pathLabel) {
  assert.deepEqual(
    actualNodes.map((node) => node.type),
    expectedNodes.map((node) => node.alias),
    `${pathLabel}: supported box sequence mismatch`,
  );

  for (let i = 0; i < expectedNodes.length; i++) {
    const expectedNode = expectedNodes[i];
    const actualNode = actualNodes[i];
    const nextPath = `${pathLabel}/${expectedNode.alias}[${i}]`;
    assert.equal(
      actualNode.size,
      dumpBoxSize(expectedNode.attrs.size),
      `${nextPath}: supported box size mismatch`,
    );
    const fieldCheck = FIELD_CHECKS[expectedNode.alias];
    if (fieldCheck) {
      fieldCheck(expectedNode, actualNode);
    }
    compareNodes(expectedNode.children, actualNode.children, nextPath);
  }
}

const fixtures = fs
  .readdirSync(MP4_DIR)
  .filter((name) => name.endsWith(".mp4"))
  .sort();

for (const fixtureName of fixtures) {
  test(`mp4dump compatibility: ${fixtureName}`, () => {
    const dumpText = fs.readFileSync(
      new URL(`./fixtures/dumps/${fixtureName}`, import.meta.url),
      "utf8",
    );
    const dumpTree = keepSupportedDumpSubtree(parseDump(dumpText));

    const mp4 = fs.readFileSync(
      new URL(`./fixtures/mp4s/${fixtureName}`, import.meta.url),
    );
    const actualTree = normalizeActual(parseBuffer(mp4));

    compareNodes(dumpTree, actualTree, fixtureName);
  });
}
