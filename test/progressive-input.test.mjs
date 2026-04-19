import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import parseBoxes, { parseBoxesProgressively } from "../src/main.js";

const SAMPLE_MP4 = new URL("./fixtures/mp4s/init.mp4", import.meta.url);

function normalize(nodes) {
  return nodes.map((node) => ({
    alias: node.alias,
    size: node.size,
    values: node.values,
    children: normalize(node.children || []),
    errors: node.errors,
  }));
}

async function* chunkBytes(bytes, chunkSize) {
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    yield bytes.subarray(offset, offset + chunkSize);
  }
}

test("default entry point progressively parses async byte iterables", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBoxes(bytes);
  const actual = await parseBoxes(chunkBytes(bytes, 7));

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("default entry point progressively parses body-like inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBoxes(bytes);
  const actual = await parseBoxes({
    body: chunkBytes(bytes, 19),
  });

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("default entry point progressively parses arrayBuffer-like inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBoxes(bytes);
  const actual = await parseBoxes({
    async arrayBuffer() {
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );
    },
  });

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("progressive parser accepts sync byte iterables", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBoxes(bytes);
  const chunks = [
    bytes.subarray(0, 11),
    bytes.subarray(11, 67),
    bytes.subarray(67),
  ];
  const actual = await parseBoxesProgressively(chunks);

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("progressive parser skips unparsed payload boxes before later boxes", async () => {
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x10, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x36,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x14, 0x6d, 0x64, 0x61, 0x74,
    0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
    0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65,
  ]);

  const parsed = await parseBoxesProgressively(chunkBytes(bytes, 5));

  assert.deepEqual(
    parsed.map((box) => [box.alias, box.size]),
    [
      ["ftyp", 16],
      ["mdat", 20],
      ["free", 8],
    ],
  );
  assert.equal(parsed[1].name, "Media Data Box");
  assert.equal(parsed[1].values.length, 0);
});
