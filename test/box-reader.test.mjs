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
      const first = r.fieldUint("first", 1, "first byte");
      r.addField("derived", first + 1, "derived value");
      r.fieldBytes("tail", 2);
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
      r.fieldUint("version", 1);
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

test("reader-emitted issues are attached to parsed boxes", () => {
  definitions.TS2W = {
    parser(r) {
      r.fieldUint("version", 1);
      r.addIssue("warning", "nonstandard but parseable");
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("TS2W", new Uint8Array([7])));

    assert.deepEqual(
      parsed[0].values.map((value) => value.key),
      ["version"],
    );
    assert.deepEqual(parsed[0].issues, [
      {
        severity: "warning",
        message: "nonstandard but parseable",
      },
    ]);
  } finally {
    delete definitions.TS2W;
  }
});

test("legacy parser return objects still append after reader fields", () => {
  definitions.TST3 = {
    parser(r) {
      r.fieldUint("emitted", 1);
      return { returned: r.readUint(1) };
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

test("read aliases consume bytes without emitting fields", () => {
  definitions.TST4 = {
    parser(r) {
      const skipped = r.readUint(1);
      r.addField("value", r.readBytes(2), `skipped ${skipped}`);
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("TST4", new Uint8Array([1, 2, 3])));

    assert.deepEqual(
      parsed[0].values.map((value) => value.key),
      ["value"],
    );
    assert.equal(parsed[0].values[0].description, "skipped 1");
    assert.equal(parsed[0].values[0].value, "0203");
  } finally {
    delete definitions.TST4;
  }
});

test("bit and flag fields expose decoded details", () => {
  definitions.TST5 = {
    parser(r) {
      const packed = r.fieldBits("packed", 1, [
        { key: "reserved", bits: 3 },
        { key: "value", bits: 5 },
      ]);
      const flags = r.fieldFlags("flags", 1, {
        first: 0x01,
        third: 0x04,
      });
      r.addField("returned", packed + flags);
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("TST5", new Uint8Array([0xe1, 0x05])));
    const [packed, flags, returned] = parsed[0].values;

    assert.equal(packed.kind, "bits");
    assert.equal(packed.value, 1);
    assert.equal(packed.raw, 0xe1);
    assert.equal(packed.bits, 8);
    assert.deepEqual(packed.fields, [
      { key: "reserved", value: 7, bits: 3, shift: 5, mask: 0xe0 },
      { key: "value", value: 1, bits: 5, shift: 0, mask: 0x1f },
    ]);

    assert.equal(flags.kind, "flags");
    assert.equal(flags.value, 0x05);
    assert.equal(flags.raw, 0x05);
    assert.equal(flags.bits, 8);
    assert.deepEqual(flags.flags, [
      { key: "first", value: true, mask: 0x01 },
      { key: "third", value: true, mask: 0x04 },
    ]);

    assert.equal(returned.value, 6);
  } finally {
    delete definitions.TST5;
  }
});

test("fixed-point fields expose their raw bit size", () => {
  definitions.TST6 = {
    parser(r) {
      r.fieldFixedPoint("unsigned", 2, 8, "8.8");
      r.fieldSignedFixedPoint("signed", 4, 32, 16, "16.16");
    },
  };

  try {
    const parsed = parseBuffer(
      boxBytes("TST6", new Uint8Array([0x01, 0x80, 0xff, 0xff, 0x00, 0x00])),
    );
    const [unsigned, signed] = parsed[0].values;

    assert.equal(unsigned.kind, "fixed-point");
    assert.equal(unsigned.value, 1.5);
    assert.equal(unsigned.raw, 0x0180);
    assert.equal(unsigned.format, "8.8");
    assert.equal(unsigned.signed, false);
    assert.equal(unsigned.bits, 16);

    assert.equal(signed.kind, "fixed-point");
    assert.equal(signed.value, -1);
    assert.equal(signed.raw, 0xffff0000);
    assert.equal(signed.format, "16.16");
    assert.equal(signed.signed, true);
    assert.equal(signed.bits, 32);
  } finally {
    delete definitions.TST6;
  }
});

test("unsupported reader field values are reported as parser errors", () => {
  definitions.TST7 = {
    parser(r) {
      r.addField("bad", undefined);
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("TST7", new Uint8Array([])));

    assert.deepEqual(parsed[0].values, []);
    assert.deepEqual(
      parsed[0].issues.map((issue) => issue.message),
      ["Unsupported parsed field value: undefined"],
    );
  } finally {
    delete definitions.TST7;
  }
});

test("unsupported legacy return values are reported as parser errors", () => {
  definitions.TST8 = {
    parser() {
      return { bad: undefined };
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("TST8", new Uint8Array([])));

    assert.deepEqual(parsed[0].values, []);
    assert.deepEqual(
      parsed[0].issues.map((issue) => issue.message),
      ["Unsupported parsed field value: undefined"],
    );
  } finally {
    delete definitions.TST8;
  }
});
