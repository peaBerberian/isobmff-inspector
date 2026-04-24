import assert from "node:assert/strict";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import fs from "node:fs";
import test from "node:test";

import parseBoxes, { parseBuffer, parseEvents } from "../src/main.js";

const SAMPLE_MP4 = new URL("./fixtures/mp4s/init.mp4", import.meta.url);

function normalize(nodes) {
  return nodes.map((node) => ({
    type: node.type,
    uuid: node.uuid,
    offset: node.offset,
    size: node.size,
    actualSize: node.actualSize,
    headerSize: node.headerSize,
    sizeField: node.sizeField,
    values: node.values,
    children: normalize(node.children || []),
    issues: node.issues,
  }));
}

async function* chunkBytes(bytes, chunkSize) {
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    yield bytes.subarray(offset, offset + chunkSize);
  }
}

const WebBlob = globalThis.Blob ?? NodeBlob;
const WebFile = globalThis.File ?? NodeFile;

test("default entry point progressively parses async byte iterables", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBuffer(bytes);
  const actual = await parseBoxes(chunkBytes(bytes, 7));

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("default entry point progressively parses body-like inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBuffer(bytes);
  const actual = await parseBoxes({
    body: chunkBytes(bytes, 19),
  });

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("default entry point progressively parses arrayBuffer-like inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBuffer(bytes);
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

test("default entry point progressively parses Blob inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBuffer(bytes);
  const blob = new WebBlob([bytes], { type: "video/mp4" });
  const actual = await parseBoxes(blob);

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("default entry point progressively parses File inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBuffer(bytes);
  const file = new WebFile([bytes], "init.mp4", { type: "video/mp4" });
  const actual = await parseBoxes(file);

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("event parser progressively parses File inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const file = new WebFile([bytes], "init.mp4", { type: "video/mp4" });
  const events = [];

  for await (const event of parseEvents(file)) {
    events.push(event.event);
  }

  assert.equal(events[0], "box-start");
  assert(events.includes("box-complete"));
});

test("default entry point progressively parses sync byte iterables", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const expected = parseBuffer(bytes);
  const chunks = [
    bytes.subarray(0, 11),
    bytes.subarray(11, 67),
    bytes.subarray(67),
  ];
  const actual = await parseBoxes(chunks);

  assert.deepEqual(normalize(actual), normalize(expected));
});

test("progressive parser skips unparsed payload boxes before later boxes", async () => {
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x10, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x36,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x14, 0x6d, 0x64, 0x61, 0x74,
    0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
    0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65,
  ]);

  const parsed = await parseBoxes(chunkBytes(bytes, 5));

  assert.deepEqual(
    parsed.map((box) => [
      box.type,
      box.offset,
      box.size,
      box.actualSize,
      box.headerSize,
      box.sizeField,
    ]),
    [
      ["ftyp", 0, 16, 16, 8, "size"],
      ["mdat", 16, 20, 20, 8, "size"],
      ["free", 36, 8, 8, 8, "size"],
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
    offset: 0,
    size: 24,
    actualSize: 24,
    headerSize: 24,
    sizeField: "size",
  };

  assert.deepEqual(parseBuffer(bytes)[0], {
    ...expected,
    name: "User-defined Box",
    description: "Custom box. Those are not yet parsed here.",
    values: [],
    issues: [],
  });

  assert.deepEqual((await parseBoxes(chunkBytes(bytes, 5)))[0], {
    ...expected,
    name: "User-defined Box",
    description: "Custom box. Those are not yet parsed here.",
    values: [],
    issues: [],
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
  for await (const event of parseEvents(chunkBytes(bytes, 3))) {
    events.push(event);
  }

  assert.deepEqual(
    events.map((event) => [event.event, event.path.join("/")]),
    [
      ["box-start", "ftyp"],
      ["box-complete", "ftyp"],
      ["box-start", "moov"],
      ["box-start", "moov/free"],
      ["box-complete", "moov/free"],
      ["box-complete", "moov"],
      ["box-start", "mdat"],
      ["box-complete", "mdat"],
    ],
  );
  assert.deepEqual(
    events
      .filter((event) => event.event === "box-start")
      .map((event) => [
        event.type,
        event.offset,
        event.size,
        event.headerSize,
        event.sizeField,
      ]),
    [
      ["ftyp", 0, 16, 8, "size"],
      ["moov", 16, 16, 8, "size"],
      ["free", 24, 8, 8, "size"],
      ["mdat", 32, 20, 8, "size"],
    ],
  );

  const moovComplete = events.find(
    (event) =>
      event.event === "box-complete" && event.path.join("/") === "moov",
  );
  assert.equal(moovComplete?.box.children?.[0]?.type, "free");
});

test("extends-to-end boxes keep declared size 0 and expose actualSize separately", async () => {
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x00, 0x66, 0x72, 0x65, 0x65, 0xaa, 0xbb, 0xcc, 0xdd,
  ]);

  assert.deepEqual(parseBuffer(bytes), [
    {
      type: "free",
      offset: 0,
      size: 0,
      actualSize: 12,
      headerSize: 8,
      sizeField: "extendsToEnd",
      name: "Free Space Box",
      description: "This box can be completely ignored",
      values: [],
      issues: [],
    },
  ]);

  assert.deepEqual(await parseBoxes(chunkBytes(bytes, 3)), [
    {
      type: "free",
      offset: 0,
      size: 0,
      actualSize: 12,
      headerSize: 8,
      sizeField: "extendsToEnd",
      name: "Free Space Box",
      description: "This box can be completely ignored",
      values: [],
      issues: [],
    },
  ]);
});

test("event parser keeps box-start and box-complete size semantics aligned for extends-to-end boxes", async () => {
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x00, 0x66, 0x72, 0x65, 0x65, 0xaa, 0xbb, 0xcc, 0xdd,
  ]);

  const bufferEvents = [];
  for await (const event of parseEvents(bytes)) {
    bufferEvents.push(event);
  }

  const progressiveEvents = [];
  for await (const event of parseEvents(chunkBytes(bytes, 3))) {
    progressiveEvents.push(event);
  }

  for (const events of [bufferEvents, progressiveEvents]) {
    assert.deepEqual(
      events.map((event) =>
        event.event === "box-start"
          ? [event.event, event.type, event.size, event.sizeField]
          : [event.event, event.box.type, event.box.size, event.box.actualSize],
      ),
      [
        ["box-start", "free", 0, "extendsToEnd"],
        ["box-complete", "free", 0, 12],
      ],
    );
  }
});

test("event parser treats ilst entries as nested metadata item boxes", async () => {
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x24, 0x69, 0x6c, 0x73, 0x74, 0x00, 0x00, 0x00, 0x1c,
    0xa9, 0x74, 0x6f, 0x6f, 0x00, 0x00, 0x00, 0x14, 0x64, 0x61, 0x74, 0x61,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x4c, 0x61, 0x76, 0x66,
  ]);

  const events = [];
  for await (const event of parseEvents(chunkBytes(bytes, 3))) {
    events.push(event);
  }

  assert.deepEqual(
    events.map((event) => [event.event, event.path.join("/")]),
    [
      ["box-start", "ilst"],
      ["box-start", "ilst/©too"],
      ["box-start", "ilst/©too/data"],
      ["box-complete", "ilst/©too/data"],
      ["box-complete", "ilst/©too"],
      ["box-complete", "ilst"],
    ],
  );

  const itemComplete = events.find(
    (event) =>
      event.event === "box-complete" && event.path.join("/") === "ilst/©too",
  );
  assert.equal(itemComplete?.box.name, "Encoder Metadata Item");
  assert.equal(itemComplete?.box.children?.[0]?.type, "data");
});

test("event parser emits the same events for buffer inputs", async () => {
  const bytes = fs.readFileSync(SAMPLE_MP4);
  const events = [];

  for await (const event of parseEvents(bytes)) {
    events.push(event.event);
  }

  assert.equal(events[0], "box-start");
  assert(events.includes("box-complete"));
});
