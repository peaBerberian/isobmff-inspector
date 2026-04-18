import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { build } from "esbuild";

const bundleGlobal = "__inspectISOBMFFBundle";
const outputFile = "dist/bundle.js";
const execFileAsync = promisify(execFile);

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
  '  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() :\n' +
  '  typeof define === "function" && define.amd ? define(factory) :\n' +
  '  (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.inspectISOBMFF = factory());\n' +
  "})(this, function () {\n" +
  '  "use strict";\n\n' +
  bundle +
  "\n" +
  `  const bundleValue = ${bundleGlobal};\n` +
  "  return (bundleValue && bundleValue.default) || bundleValue;\n" +
  "});\n";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await writeFile(outputFile, umdBundle);
await execFileAsync("tsc", [
  "-p",
  "tsconfig.json",
  "--noEmit",
  "false",
  "--declaration",
  "--declarationMap",
  "--emitDeclarationOnly",
  "--outDir",
  "dist",
  "--rootDir",
  "src",
]);
