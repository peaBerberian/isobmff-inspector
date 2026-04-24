/**
 * @param {import("../types.js").ParsedBox[]} boxes
 * @returns {import("../types.js").SimpleParsedBox[]}
 */
export function formatParsedBoxes(boxes) {
  return boxes.map(formatParsedBox);
}

/**
 * @param {import("../types.js").ParsedBox} box
 * @returns {import("../types.js").SimpleParsedBox}
 */
function formatParsedBox(box) {
  /** @type {import("../types.js").SimpleParsedBox} */
  const simpleBox = {
    type: box.type,
    offset: box.offset,
    size: box.size,
    actualSize: box.actualSize,
    headerSize: box.headerSize,
    fields: formatValues(box.values),
  };

  if (box.sizeField !== undefined) {
    simpleBox.sizeField = box.sizeField;
  }
  if (box.uuid !== undefined) {
    simpleBox.uuid = box.uuid;
  }
  if (box.children !== undefined) {
    simpleBox.children = formatParsedBoxes(box.children);
  }
  if (box.issues.length > 0) {
    simpleBox.issues = box.issues;
  }

  return simpleBox;
}

/**
 * @param {import("../types.js").ParsedBoxValue[]} values
 * @returns {Record<string, unknown>}
 */
function formatValues(values) {
  return Object.fromEntries(
    values.map((value) => [value.key, formatField(value)]),
  );
}

/**
 * @param {import("../types.js").ParsedField} field
 * @returns {unknown}
 */
function formatField(field) {
  switch (field.kind) {
    case "number":
    case "bigint":
    case "string":
    case "boolean":
    case "null":
      return field.value;
    case "fixed-point":
      return field.value;
    case "date":
      return field.date ?? field.value;
    case "bits":
      return {
        $raw: field.raw,
        ...Object.fromEntries(
          field.fields.map((part) => [part.key, part.value]),
        ),
      };
    case "flags":
      return {
        $raw: field.raw,
        ...Object.fromEntries(
          field.flags.map((flag) => [flag.key, flag.value]),
        ),
      };
    case "array":
      return field.items.map(formatField);
    case "struct":
      return formatValues(field.fields);
    default:
      return /** @type {{ value: unknown }} */ (field).value;
  }
}
