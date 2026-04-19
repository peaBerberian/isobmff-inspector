import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import parseBoxes, {
  parseBoxEvents,
  parseBoxesProgressively,
} from "../src/main.js";

const SAMPLE_MP4 = new URL("./fixtures/mp4s/init.mp4", import.meta.url);

function normalize(nodes) {
  return nodes.map((node) => ({
    type: node.type,
    uuid: node.uuid,
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
    parsed.map((box) => [box.type, box.size]),
    [
      ["ftyp", 16],
      ["mdat", 20],
      ["free", 8],
    ],
  );
  assert.equal(parsed[1].name, "Media Data Box");
  assert.equal(parsed[1].values.length, 0);
});

test("parsers expose uuid boxes through a hex uuid property", async () => {
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x18, 0x75, 0x75, 0x69, 0x64, 0x00, 0x11, 0x22, 0x33,
    0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff,
  ]);

  const expected = {
    type: "uuid",
    uuid: "00112233445566778899AABBCCDDEEFF",
    size: 24,
  };

  assert.deepEqual(parseBoxes(bytes)[0], {
    ...expected,
    name: "User-defined Box",
    description: "Custom box. Those are not yet parsed here.",
    values: [],
  });

  assert.deepEqual((await parseBoxesProgressively(chunkBytes(bytes, 5)))[0], {
    ...expected,
    name: "User-defined Box",
    description: "Custom box. Those are not yet parsed here.",
    values: [],
  });
});

test("event parser progressively emits nested box metadata", async () => {
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x10, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x36,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0x6d, 0x6f, 0x6f, 0x76,
    0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65, 0x00, 0x00, 0x00, 0x14,
    0x6d, 0x64, 0x61, 0x74, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
    0xaa, 0xaa, 0xaa, 0xaa,
  ]);

  const events = [];
  for await (const event of parseBoxEvents(chunkBytes(bytes, 3))) {
    events.push(event);
  }

  assert.deepEqual(
    events.map((event) => [event.type, event.path.join("/")]),
    [
      ["box-start", "ftyp"],
      ["box", "ftyp"],
      ["box-start", "moov"],
      ["box-start", "moov/free"],
      ["box", "moov/free"],
      ["box-end", "moov"],
      ["box-start", "mdat"],
      ["box", "mdat"],
    ],
  );
  assert.deepEqual(
    events
      .filter((event) => event.type === "box-start")
      .map((event) => event.boxType),
    ["ftyp", "moov", "free", "mdat"],
  );

  const moovEnd = events.find(
    (event) => event.type === "box-end" && event.path.join("/") === "moov",
  );
  assert.equal(moovEnd?.box.children?.[0]?.type, "free");
});

test("event parser emits the same event types for buffer inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const events = [];

  for await (const event of parseBoxEvents(bytes)) {
    events.push(event.type);
  }

  assert.equal(events[0], "box-start");
  assert(events.includes("box"));
  assert(events.includes("box-end"));
});
