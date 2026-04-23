import assert from "node:assert/strict";
import test from "node:test";
import { parseBuffer } from "../src/main.js";

function box(type, payload) {
  const size = payload.length + 8;
  return new Uint8Array([
    (size >>> 24) & 0xff,
    (size >>> 16) & 0xff,
    (size >>> 8) & 0xff,
    size & 0xff,
    type.charCodeAt(0),
    type.charCodeAt(1),
    type.charCodeAt(2),
    type.charCodeAt(3),
    ...payload,
  ]);
}

test("ilst treats arbitrary Apple item types as metadata item containers", () => {
  const parsed = parseBuffer(
    box(
      "ilst",
      box(
        "©too",
        box(
          "data",
          [
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x4c, 0x61, 0x76,
            0x66,
          ],
        ),
      ),
    ),
  );

  assert.equal(parsed[0].type, "ilst");
  assert.equal(parsed[0].children?.[0]?.type, "©too");
  assert.equal(parsed[0].children?.[0]?.name, "Encoder Metadata Item");
  assert.equal(parsed[0].children?.[0]?.children?.[0]?.type, "data");
  const dataValues = Object.fromEntries(
    parsed[0].children?.[0]?.children?.[0]?.values.map((value) => [
      value.key,
      value.value,
    ]) ?? [],
  );
  assert.equal(dataValues.type_set, 0);
  assert.equal(dataValues.type_code, 1);
  assert.equal(dataValues.locale, 0);
  assert.equal(dataValues.value, "Lavf");
});

test("data keeps nonstandard wide integer payloads as bytes with a warning", () => {
  const parsed = parseBuffer(
    box(
      "data",
      [
        0x00, 0x00, 0x00, 0x15, 0x00, 0x00, 0x00, 0x00, 0x01, 0x23, 0x45, 0x67,
        0x89, 0xab, 0xcd, 0xef,
      ],
    ),
  );

  const values = Object.fromEntries(
    parsed[0].values.map((value) => [value.key, value.value]),
  );
  assert.equal(values.type_set, 0);
  assert.equal(values.type_code, 21);
  assert.equal(values.locale, 0);
  assert.equal(values.value, "0123456789ABCDEF");
  assert.equal(parsed[0].issues[0]?.severity, "warning");
  assert.match(
    parsed[0].issues[0]?.message ?? "",
    /defined for 1 to 4 byte payloads/,
  );
});

test("data parses signed and unsigned integer metadata values", () => {
  const signedParsed = parseBuffer(
    box("data", [0x00, 0x00, 0x00, 0x15, 0x00, 0x00, 0x00, 0x00, 0xff, 0xfe]),
  );
  const unsignedParsed = parseBuffer(
    box("data", [0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x00, 0xff, 0xfe]),
  );

  const signedValues = Object.fromEntries(
    signedParsed[0].values.map((value) => [value.key, value.value]),
  );
  const unsignedValues = Object.fromEntries(
    unsignedParsed[0].values.map((value) => [value.key, value.value]),
  );
  assert.equal(signedValues.value, -2);
  assert.equal(unsignedValues.value, 65534);
});

test("cslg version 0 parses signed timing fields", () => {
  const parsed = parseBuffer(
    box(
      "cslg",
      [
        0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xfe, 0xff, 0xff, 0xff, 0xff,
        0x00, 0x00, 0x00, 0x03, 0xff, 0xff, 0xff, 0xfc, 0x00, 0x00, 0x00, 0x05,
      ],
    ),
  );
  const values = Object.fromEntries(
    parsed[0].values.map((value) => [value.key, value.value]),
  );
  assert.equal(values.compositionToDTSShift, -2);
  assert.equal(values.leastDecodeToDisplayDelta, -1);
  assert.equal(values.greatestDecodeToDisplayDelta, 3);
  assert.equal(values.compositionStartTime, -4);
  assert.equal(values.compositionEndTime, 5);
});

test("emsg version 0 parses strings and payload", () => {
  const parsed = parseBuffer(
    box(
      "emsg",
      [
        0x00, 0x00, 0x00, 0x00, 0x75, 0x72, 0x6e, 0x00, 0x76, 0x31, 0x00, 0x00,
        0x00, 0x03, 0xe8, 0x00, 0x00, 0x00, 0x14, 0x00, 0x00, 0x00, 0x1e, 0x00,
        0x00, 0x00, 0x07, 0xde, 0xad, 0xbe, 0xef,
      ],
    ),
  );

  const values = Object.fromEntries(
    parsed[0].values.map((value) => [value.key, value.value]),
  );
  assert.equal(values.scheme_id_uri, "urn");
  assert.equal(values.value, "v1");
  assert.equal(values.timescale, 1000);
  assert.equal(values.presentation_time_delta, 20);
  assert.equal(values.event_duration, 30);
  assert.equal(values.event_id, 7);
  assert.equal(values.message_data, "DEADBEEF");
});

test("keys parses metadata key entries", () => {
  const parsed = parseBuffer(
    box(
      "keys",
      [
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x0d,
        0x6d, 0x64, 0x74, 0x61, 0x74, 0x69, 0x74, 0x6c, 0x65,
      ],
    ),
  );

  const entry = parsed[0].values.find((value) => value.key === "entries")
    .items[0];
  const fields = Object.fromEntries(
    entry.fields.map((value) => [value.key, value.value]),
  );
  assert.equal(fields.namespace, "mdta");
  assert.equal(fields.value, "title");
});

test("sgpd parses roll recovery entries", () => {
  const parsed = parseBuffer(
    box(
      "sgpd",
      [
        0x01, 0x00, 0x00, 0x00, 0x72, 0x6f, 0x6c, 0x6c, 0x00, 0x00, 0x00, 0x02,
        0x00, 0x00, 0x00, 0x01, 0xff, 0xfe,
      ],
    ),
  );

  const values = Object.fromEntries(
    parsed[0].values.map((value) => [value.key, value]),
  );
  assert.equal(values.grouping_type.value, "roll");
  assert.equal(values.entry_count.value, 1);
  assert.equal(values.entries.items[0].fields[0].value, -2);
});

test("sbgp parses group mappings", () => {
  const parsed = parseBuffer(
    box(
      "sbgp",
      [
        0x01, 0x00, 0x00, 0x00, 0x72, 0x61, 0x70, 0x20, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00, 0x02,
      ],
    ),
  );

  const values = Object.fromEntries(
    parsed[0].values.map((value) => [value.key, value]),
  );
  assert.equal(values.grouping_type.value, "rap ");
  assert.equal(values.entries.items[0].fields[0].value, 5);
  assert.equal(values.entries.items[0].fields[1].value, 2);
});

test("dOps parses Opus decoder configuration", () => {
  const parsed = parseBuffer(
    box(
      "dOps",
      [0x00, 0x02, 0x00, 0x80, 0x00, 0x00, 0xbb, 0x80, 0x00, 0x00, 0x00],
    ),
  );

  const values = Object.fromEntries(
    parsed[0].values.map((value) => [value.key, value.value]),
  );
  assert.equal(values.Version, 0);
  assert.equal(values.OutputChannelCount, 2);
  assert.equal(values.PreSkip, 128);
  assert.equal(values.InputSampleRate, 48000);
  assert.equal(values.ChannelMappingFamily, 0);
});
