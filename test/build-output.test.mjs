import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const BUNDLE_URL = new URL("../dist/bundle.js", import.meta.url);
const BUNDLE_PATH = fileURLToPath(BUNDLE_URL);
const require = createRequire(import.meta.url);
const MISSING_BUNDLE_MESSAGE =
  "dist/bundle.js is missing; run npm run build to test package output";

function assertPublicApi(inspectISOBMFF) {
  assert.equal(typeof inspectISOBMFF, "function");
  assert.equal(typeof inspectISOBMFF.parse, "function");
  assert.equal(typeof inspectISOBMFF.parseBuffer, "function");
  assert.equal(typeof inspectISOBMFF.parseEvents, "function");
}

function skipIfNoBundle(t) {
  if (!fs.existsSync(BUNDLE_URL)) {
    t.skip(MISSING_BUNDLE_MESSAGE);
  }
}

test("built bundle exposes the public API through CommonJS require", (t) => {
  skipIfNoBundle(t);

  assertPublicApi(require(BUNDLE_PATH));
});

test("built bundle exposes the public API through the browser global", (t) => {
  skipIfNoBundle(t);

  const code = fs.readFileSync(BUNDLE_URL, "utf8");
  const context = {};
  context.globalThis = context;
  context.self = context;

  vm.runInNewContext(code, context);

  assertPublicApi(context.inspectISOBMFF);
});

test("built bundle exposes the public API through ESM default import", async (t) => {
  skipIfNoBundle(t);

  const module = await import(BUNDLE_URL.href);

  assertPublicApi(module.default);
});
