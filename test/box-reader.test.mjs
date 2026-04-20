import assert from "node:assert/strict";
import test from "node:test";

import definitions from "../src/boxes/index.js";
import { parseBuffer } from "../src/main.js";

function boxBytes(type, content) {
  const bytes = new Uint8Array(8 + content.length);
  const size = bytes.length;
  bytes[0] = (size >>> 24) & 0xff;
  bytes[1] = (size >>> 16) & 0xff;
  bytes[2] = (size >>> 8) & 0xff;
  bytes[3] = size & 0xff;
  for (let i = 0; i < type.length; i++) {
    bytes[4 + i] = type.charCodeAt(i);
  }
  bytes.set(content, 8);
  return bytes;
}

test("box parsers can emit ordered fields through the reader", () => {
  definitions.TST1 = {
    parser(r) {
      const first = r.uint("first", 1, "first byte");
      r.field("derived", first + 1, "derived value");
      r.hex("tail", 2);
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("TST1", new Uint8Array([1, 2, 3])));

    assert.deepEqual(
      parsed[0].values.map((value) => value.key),
      ["first", "derived", "tail"],
    );
    assert.equal(parsed[0].values[0].description, "first byte");
    assert.equal(parsed[0].values[0].value, 1);
    assert.equal(parsed[0].values[1].description, "derived value");
    assert.equal(parsed[0].values[1].value, 2);
    assert.equal(parsed[0].values[2].value, "0203");
  } finally {
    delete definitions.TST1;
  }
});

test("reader-emitted fields survive parser errors", () => {
  definitions.TST2 = {
    parser(r) {
      r.uint("version", 1);
      throw new Error("boom");
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("TST2", new Uint8Array([7])));

    assert.deepEqual(
      parsed[0].values.map((value) => value.key),
      ["version"],
    );
    assert.equal(parsed[0].values[0].value, 7);
    assert.deepEqual(
      parsed[0].issues.map((issue) => issue.message),
      ["boom"],
    );
  } finally {
    delete definitions.TST2;
  }
});

test("legacy parser return objects still append after reader fields", () => {
  definitions.TST3 = {
    parser(r) {
      r.uint("emitted", 1);
      return { returned: r.bytesToInt(1) };
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("TST3", new Uint8Array([4, 5])));

    assert.deepEqual(
      parsed[0].values.map((value) => value.key),
      ["emitted", "returned"],
    );
    assert.equal(parsed[0].values[0].value, 4);
    assert.equal(parsed[0].values[1].value, 5);
  } finally {
    delete definitions.TST3;
  }
});
