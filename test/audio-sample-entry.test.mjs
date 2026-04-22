import assert from "node:assert/strict";
import test from "node:test";

import mp4a from "../src/boxes/mp4a.js";

function readerFor(entries) {
  const pending = [...entries];

  return {
    readUint(nbBytes) {
      const next = pending.shift();
      assert.ok(next, `unexpected ${nbBytes}-byte read`);
      assert.equal(nbBytes, next[0]);
      return next[1];
    },
  };
}

function baseAudioSampleEntry(version) {
  return [
    [1, 0],
    [1, 0],
    [1, 0],
    [1, 0],
    [1, 0],
    [1, 0],
    [2, 1],
    [2, version],
    [2, 0],
    [4, 0],
    [2, 2],
    [2, 16],
    [2, 0],
    [2, 0],
    [4, 0xac440000],
  ];
}

test("version 1 audio sample entry fields are parsed flat", () => {
  const result = mp4a.parser(
    readerFor([...baseAudioSampleEntry(1), [4, 1024], [4, 4], [4, 8], [4, 2]]),
  );

  assert.equal(result.version_1_fields, undefined);
  assert.equal(result.samples_per_packet, 1024);
  assert.equal(result.bytes_per_packet, 4);
  assert.equal(result.bytes_per_frame, 8);
  assert.equal(result.bytes_per_sample, 2);
});

test("version 2 audio sample entry fields are parsed flat", () => {
  const result = mp4a.parser(
    readerFor([
      ...baseAudioSampleEntry(2),
      [4, 36],
      [4, 0xac440000],
      [4, 2],
      [4, 0],
      [4, 16],
      [4, 0],
      [4, 4],
      [4, 1024],
    ]),
  );

  assert.equal(result.version_2_fields, undefined);
  assert.equal(result.struct_size, 36);
  assert.equal(result.sample_rate.kind, "fixed-point");
  assert.equal(result.sample_rate.value, 44100);
  assert.equal(result.sample_rate.raw, 0xac440000);
  assert.equal(result.channel_count, 2);
  assert.equal(result.reserved_1, 0);
  assert.equal(result.bits_per_channel, 16);
  assert.equal(result.format_specific_flags, 0);
  assert.equal(result.bytes_per_audio_packet, 4);
  assert.equal(result.LPCM_frames_per_audio_packet, 1024);
});
