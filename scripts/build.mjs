import { mkdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const bundleGlobal = "__inspectISOBMFFBundle";
const outputFile = "dist/bundle.js";

const result = await build({
  bundle: true,
  entryPoints: ["src/main.js"],
  format: "iife",
  globalName: bundleGlobal,
  legalComments: "none",
  platform: "browser",
  target: ["es2017"],
  write: false,
});

const bundle = result.outputFiles[0].text;
const umdBundle =
  "(function (global, factory) {\n" +
  "  typeof exports === \"object\" && typeof module !== \"undefined\" ? module.exports = factory() :\n" +
  "  typeof define === \"function\" && define.amd ? define(factory) :\n" +
  "  (global = typeof globalThis !== \"undefined\" ? globalThis : global || self, global.inspectISOBMFF = factory());\n" +
  "})(this, function () {\n" +
  "  \"use strict\";\n\n" +
  bundle +
  "\n" +
  `  const bundleValue = ${bundleGlobal};\n` +
  "  return (bundleValue && bundleValue.default) || bundleValue;\n" +
  "});\n";

await mkdir("dist", { recursive: true });
await writeFile(outputFile, umdBundle);
