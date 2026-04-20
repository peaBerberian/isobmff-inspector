const MAC_EPOCH_TO_UNIX_EPOCH_SECONDS = 2082844800;

/**
 * @param {number} value
 * @param {number} fractionalBits
 * @returns {number}
 */
function decodeFixedPoint(value, fractionalBits) {
  return value / 2 ** fractionalBits;
}

/**
 * @param {number} value
 * @param {number} bits
 * @returns {number}
 */
function toSignedInt(value, bits) {
  const maxUnsigned = 2 ** bits;
  const signedBoundary = 2 ** (bits - 1);
  return value >= signedBoundary ? value - maxUnsigned : value;
}

/**
 * @param {number} value
 * @param {number} bits
 * @param {number} fractionalBits
 * @returns {number}
 */
function decodeSignedFixedPoint(value, bits, fractionalBits) {
  return decodeFixedPoint(toSignedInt(value, bits), fractionalBits);
}

/**
 * @param {number} raw
 * @param {number} fractionalBits
 * @param {string} format
 * @returns {import("./types.js").ParsedFixedPointField}
 */
function fixedPointField(raw, fractionalBits, format) {
  return {
    kind: "fixed-point",
    value: decodeFixedPoint(raw, fractionalBits),
    raw,
    format,
    signed: false,
  };
}

/**
 * @param {number} raw
 * @param {number} bits
 * @param {number} fractionalBits
 * @param {string} format
 * @returns {import("./types.js").ParsedFixedPointField}
 */
function signedFixedPointField(raw, bits, fractionalBits, format) {
  return {
    kind: "fixed-point",
    value: decodeSignedFixedPoint(raw, bits, fractionalBits),
    raw,
    format,
    signed: true,
    bits,
  };
}

/**
 * @param {number} raw
 * @param {number} totalBits
 * @param {import("./types.js").ParsedBitsFieldPartDefinition[]} parts
 * @returns {import("./types.js").ParsedBitsField}
 */
function bitsField(raw, totalBits, parts) {
  let remainingBits = totalBits;
  const fields = parts.map((part) => {
    remainingBits -= part.bits;
    const value = Math.floor(raw / 2 ** remainingBits) & (2 ** part.bits - 1);
    return {
      key: part.key,
      value,
      bits: part.bits,
      shift: remainingBits,
      mask: (2 ** part.bits - 1) * 2 ** remainingBits,
    };
  });

  return {
    kind: "bits",
    value: fields.find((field) => field.key === "value")?.value ?? raw,
    raw,
    bits: totalBits,
    fields,
  };
}

/**
 * @param {number} raw
 * @param {number} totalBits
 * @param {Record<string, number>} flags
 * @returns {import("./types.js").ParsedFlagsField}
 */
function flagsField(raw, totalBits, flags) {
  return {
    kind: "flags",
    value: raw,
    raw,
    bits: totalBits,
    flags: Object.entries(flags).map(([key, mask]) => ({
      key,
      value: (raw & mask) !== 0,
      mask,
    })),
  };
}

/**
 * @param {number | bigint} unixSeconds
 * @returns {string | null}
 */
function unixSecondsToIsoString(unixSeconds) {
  if (typeof unixSeconds === "bigint") {
    if (
      unixSeconds < BigInt(Number.MIN_SAFE_INTEGER) ||
      unixSeconds > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      return null;
    }
    return unixSecondsToIsoString(Number(unixSeconds));
  }

  const unixMilliseconds = unixSeconds * 1000;
  if (!Number.isFinite(unixMilliseconds)) {
    return null;
  }

  const date = new Date(unixMilliseconds);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * @param {number | bigint} value
 * @returns {import("./types.js").ParsedDateField}
 */
function macDateField(value) {
  const unixSeconds =
    typeof value === "bigint"
      ? value - BigInt(MAC_EPOCH_TO_UNIX_EPOCH_SECONDS)
      : value - MAC_EPOCH_TO_UNIX_EPOCH_SECONDS;

  return {
    kind: "date",
    value,
    date: unixSecondsToIsoString(unixSeconds),
    epoch: "1904-01-01T00:00:00.000Z",
    unit: "seconds",
  };
}

/**
 * @param {string} key
 * @param {unknown} value
 * @param {string=} description
 * @returns {import("./types.js").ParsedBoxValue}
 */
function parsedBoxValue(key, value, description) {
  const ret = {
    key,
    ...normalizeField(value),
  };
  if (description !== undefined) {
    return { ...ret, description };
  }
  return ret;
}

/**
 * @param {import("./types.js").ParsedBoxValue[]} fields
 * @param {string=} layout
 * @returns {import("./types.js").ParsedStructField}
 */
function structField(fields, layout) {
  /** @type {import("./types.js").ParsedStructField} */
  const ret = {
    kind: "struct",
    fields,
  };
  if (layout !== undefined) {
    ret.layout = layout;
  }
  return ret;
}

/**
 * @param {unknown} value
 * @returns {value is import("./types.js").ParsedField}
 */
function isParsedField(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    typeof value.kind === "string"
  );
}

/**
 * @param {unknown} value
 * @returns {import("./types.js").ParsedField}
 */
function normalizeField(value) {
  if (isParsedField(value)) {
    return value;
  }

  if (typeof value === "number") {
    return { kind: "number", value };
  }
  if (typeof value === "bigint") {
    return { kind: "bigint", value };
  }
  if (typeof value === "string") {
    return { kind: "string", value };
  }
  if (typeof value === "boolean") {
    return { kind: "boolean", value };
  }
  if (Array.isArray(value)) {
    return {
      kind: "array",
      items: value.map((item) => normalizeField(item)),
    };
  }
  if (value && typeof value === "object") {
    return structField(
      Object.entries(value).map(([key, fieldValue]) =>
        parsedBoxValue(key, fieldValue),
      ),
    );
  }
  if (value === null) {
    return { kind: "null", value: null };
  }
  return { kind: "unknown", value };
}

export {
  bitsField,
  decodeFixedPoint,
  decodeSignedFixedPoint,
  fixedPointField,
  flagsField,
  macDateField,
  normalizeField,
  parsedBoxValue,
  signedFixedPointField,
  structField,
  toSignedInt,
};
