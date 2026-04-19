import assert from "node:assert/strict";
import test from "node:test";

import definitions from "../src/boxes/index.js";

test("all box definitions have a non-empty top-level description", () => {
  const missingDescriptions = Object.entries(definitions)
    .filter(
      ([, definition]) =>
        typeof definition.description !== "string" ||
        definition.description.trim() === "",
    )
    .map(([alias]) => alias);

  assert.deepEqual(missingDescriptions, []);
});
