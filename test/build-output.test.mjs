import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const BUNDLE_URL = new URL("../dist/bundle.js", import.meta.url);
const BUNDLE_PATH = fileURLToPath(BUNDLE_URL);
const CLI_URL = new URL("../dist/cli.cjs", import.meta.url);
const CLI_PATH = fileURLToPath(CLI_URL);
const DECLARATION_URL = new URL("../dist/main.d.ts", import.meta.url);
const require = createRequire(import.meta.url);
const MISSING_BUNDLE_MESSAGE =
  "dist/bundle.js is missing; run npm run build to test package output";
const PUBLIC_TYPE_EXPORTS = [
  "ParsedBox",
  "SimpleParsedBox",
  "ParsedBoxValue",
  "ParsedField",
  "ParsedBoxIssue",
  "ParseOptions",
  "ParsedBoxParseEvent",
  "ParsedBoxStartEvent",
  "ParsedBoxCompleteEvent",
  "ISOBMFFInput",
  "ISOBMFFByteChunk",
  "ISOBMFFProgressiveInput",
];

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

function skipIfNoCli(t) {
  if (!fs.existsSync(CLI_URL)) {
    t.skip("dist/cli.cjs is missing; run npm run build to test package output");
  }
}

function skipIfNoDeclarations(t) {
  if (!fs.existsSync(DECLARATION_URL)) {
    t.skip(
      "dist/main.d.ts is missing; run npm run build to test package output",
    );
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

test("package metadata exposes an npx-compatible CLI command", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.equal(packageJson.bin["isobmff-inspector"], "dist/cli.cjs");
});

test("built declarations expose public types from the package root", (t) => {
  skipIfNoDeclarations(t);

  const declaration = fs.readFileSync(DECLARATION_URL, "utf8");

  for (const typeName of PUBLIC_TYPE_EXPORTS) {
    assert.match(
      declaration,
      new RegExp(`export type ${typeName} = import\\("\\./types\\.js"\\)\\.`),
    );
  }
});

test("built CLI is executable by Node and package managers", (t) => {
  skipIfNoCli(t);

  const code = fs.readFileSync(CLI_PATH, "utf8");
  const mode = fs.statSync(CLI_PATH).mode;

  assert.equal(code.slice(0, 19), "#!/usr/bin/env node");
  assert.equal(mode & 0o111, 0o111);
});
