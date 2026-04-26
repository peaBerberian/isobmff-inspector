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

function baseAudioSampleEntry(version) {
  return [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    version,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    0,
    16,
    0,
    0,
    0,
    0,
    0xac,
    0x44,
    0x00,
    0x00,
  ];
}

test("version 1 audio sample entry fields are parsed flat", () => {
  const parsed = parseBuffer(
    box("mp4a", [
      ...baseAudioSampleEntry(1),
      0x00,
      0x00,
      0x04,
      0x00,
      0x00,
      0x00,
      0x00,
      0x04,
      0x00,
      0x00,
      0x00,
      0x08,
      0x00,
      0x00,
      0x00,
      0x02,
    ]),
  );
  const values = Object.fromEntries(
    parsed[0].values.map((value) => [value.key, value]),
  );

  assert.equal(values.samples_per_packet.value, 1024);
  assert.equal(values.bytes_per_packet.value, 4);
  assert.equal(values.bytes_per_frame.value, 8);
  assert.equal(values.bytes_per_sample.value, 2);
});

test("version 2 audio sample entry fields are parsed flat", () => {
  const parsed = parseBuffer(
    box("mp4a", [
      ...baseAudioSampleEntry(2),
      0x00,
      0x00,
      0x00,
      0x24,
      0xac,
      0x44,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x02,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x10,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x04,
      0x00,
      0x00,
      0x04,
      0x00,
    ]),
  );
  const values = Object.fromEntries(
    parsed[0].values.map((value) => [value.key, value]),
  );

  assert.equal(values.struct_size.value, 36);
  assert.equal(values.sample_rate.kind, "fixed-point");
  assert.equal(values.sample_rate.value, 44100);
  assert.equal(values.sample_rate.raw, 0xac440000);
  assert.equal(values.channel_count.value, 2);
  assert.equal(values.reserved_1.value, 0);
  assert.equal(values.bits_per_channel.value, 16);
  assert.equal(values.format_specific_flags.value, 0);
  assert.equal(values.bytes_per_audio_packet.value, 4);
  assert.equal(values.LPCM_frames_per_audio_packet.value, 1024);
});
