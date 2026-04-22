import assert from "node:assert/strict";
import test from "node:test";

import definitions from "../src/boxes/index.js";
import { parse, parseBuffer } from "../src/main.js";

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

test("simple format exposes parsed fields as plain keyed values", () => {
  definitions.SMP1 = {
    parser(r) {
      r.fieldUint("version", 1);
      r.fieldFixedPoint("ratio", 2, 8, "8.8");
      r.fieldMacDate("creation_time", 4);
      r.addField("entries", [
        { sample_count: 3, sample_delta: 1024 },
        { sample_count: 1, sample_delta: 512 },
      ]);
    },
  };

  try {
    const parsed = parseBuffer(
      boxBytes(
        "SMP1",
        new Uint8Array([0x02, 0x01, 0x80, 0x7c, 0x25, 0xb0, 0x80]),
      ),
      { format: "simple" },
    );

    assert.deepEqual(parsed, [
      {
        type: "SMP1",
        offset: 0,
        size: 15,
        headerSize: 8,
        sizeField: "size",
        fields: {
          version: 2,
          ratio: 1.5,
          creation_time: "1970-01-01T00:00:00.000Z",
          entries: [
            { sample_count: 3, sample_delta: 1024 },
            { sample_count: 1, sample_delta: 512 },
          ],
        },
      },
    ]);
  } finally {
    delete definitions.SMP1;
  }
});

test("simple format preserves bit and flag names with raw values", () => {
  definitions.SMP2 = {
    parser(r) {
      r.fieldBits("packed-field", 1, [
        { key: "reserved", bits: 3 },
        { key: "value", bits: 5 },
      ]);
      r.fieldFlags("flags", 1, {
        "default-base-is-moof": 0x01,
        "sample-duration-present": 0x04,
      });
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("SMP2", new Uint8Array([0xe1, 0x05])), {
      format: "simple",
    });

    assert.deepEqual(parsed[0].fields, {
      "packed-field": {
        $raw: 0xe1,
        reserved: 7,
        value: 1,
      },
      flags: {
        $raw: 0x05,
        "default-base-is-moof": true,
        "sample-duration-present": true,
      },
    });
  } finally {
    delete definitions.SMP2;
  }
});

test("simple format exposes colr nclx full_range_flag as a packed field", () => {
  const parsed = parseBuffer(
    boxBytes(
      "colr",
      new Uint8Array([
        0x6e, 0x63, 0x6c, 0x78, 0x00, 0x01, 0x00, 0x0d, 0x00, 0x06, 0x80,
      ]),
    ),
    { format: "simple" },
  );

  assert.deepEqual(parsed[0].fields, {
    colour_type: "nclx",
    colour_primaries: 1,
    transfer_characteristics: 13,
    matrix_coefficients: 6,
    full_range_flag: {
      $raw: 0x80,
      value: 1,
      reserved: 0,
    },
  });
});

test("simple format exposes colr nclc without a full_range_flag byte", () => {
  const parsed = parseBuffer(
    boxBytes(
      "colr",
      new Uint8Array([
        0x6e, 0x63, 0x6c, 0x63, 0x00, 0x01, 0x00, 0x0d, 0x00, 0x06,
      ]),
    ),
    { format: "simple" },
  );

  assert.deepEqual(parsed[0].fields, {
    colour_type: "nclc",
    colour_primaries: 1,
    transfer_characteristics: 13,
    matrix_coefficients: 6,
  });
});

test("simple format exposes colr ICC payload as ICC_profile", () => {
  const parsed = parseBuffer(
    boxBytes(
      "colr",
      new Uint8Array([0x72, 0x49, 0x43, 0x43, 0xde, 0xad, 0xbe, 0xef]),
    ),
    { format: "simple" },
  );

  assert.deepEqual(parsed[0].fields, {
    colour_type: "rICC",
    ICC_profile: "DEADBEEF",
  });
});

test("simple format keeps children", async () => {
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x10, 0x6d, 0x6f, 0x6f, 0x76, 0x00, 0x00, 0x00, 0x08,
    0x66, 0x72, 0x65, 0x65,
  ]);

  const parsed = await parse(bytes, { format: "simple" });

  assert.deepEqual(parsed, [
    {
      type: "moov",
      offset: 0,
      size: 16,
      headerSize: 8,
      sizeField: "size",
      fields: {},
      children: [
        {
          type: "free",
          offset: 8,
          size: 8,
          headerSize: 8,
          sizeField: "size",
          fields: {},
        },
      ],
    },
  ]);
});

test("simple format includes non-empty issues", () => {
  definitions.SMP3 = {
    parser(r) {
      r.fieldUint("version", 1);
    },
  };

  try {
    const parsed = parseBuffer(boxBytes("SMP3", new Uint8Array([0x00, 0xff])), {
      format: "simple",
    });

    assert.deepEqual(parsed[0].issues, [
      {
        severity: "warning",
        message: "Parser left 1 byte(s) unread.",
      },
    ]);
  } finally {
    delete definitions.SMP3;
  }
});

test("parse rejects unknown output formats", async () => {
  const bytes = boxBytes("free", new Uint8Array(0));

  assert.throws(
    () => parseBuffer(bytes, { format: "compact" }),
    /Unsupported parse format: compact/,
  );
  await assert.rejects(
    () => parse(bytes, { format: "compact" }),
    /Unsupported parse format: compact/,
  );
});
