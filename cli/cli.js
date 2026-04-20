#!/usr/bin/env node

import { once } from "node:events";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { parse } from "../src/main.js";

const USAGE = `Usage: isobmff-inspector [--format full|simple] <file>

Parse an ISOBMFF/MP4 file and print the parsed box tree as JSON.

Options:
  --format <format>  Output format: "full" or "simple". Defaults to "full".`;

async function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    await writeStdout(`${USAGE}\n`);
    return 0;
  }

  const { format, positionalArgs } = parseArgs(argv);
  if (positionalArgs.length !== 1) {
    console.error(USAGE);
    return 1;
  }

  const filePath = positionalArgs[0];
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) {
    throw new Error(`${filePath} is not a file`);
  }

  const parsedBoxes = await parse(createReadStream(filePath), { format });
  await writeStdout(`${stringifyParsedBoxes(parsedBoxes)}\n`);
  return 0;
}

main(process.argv.slice(2)).then(
  (exitCode) => {
    process.exitCode = exitCode;
  },
  (error) => {
    const commandName = basename(process.argv[1] || "isobmff-inspector");
    console.error(`${commandName}: ${error.message}`);
    process.exitCode = 1;
  },
);

/**
 * Enhancement of `JSON.stringify` so it doesn't trip on bigint values.
 * @param {*} boxes
 * @returns {string}
 */
function stringifyParsedBoxes(boxes) {
  return JSON.stringify(
    boxes,
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );
}

async function writeStdout(text) {
  if (!process.stdout.write(text)) {
    await once(process.stdout, "drain");
  }
}

/**
 * @param {string[]} argv
 * @returns {{ format: "full" | "simple", positionalArgs: string[] }}
 */
function parseArgs(argv) {
  /** @type {"full" | "simple"} */
  let format = "full";
  /** @type {string[]} */
  const positionalArgs = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--format") {
      const value = argv[++i];
      format = parseFormat(value);
    } else if (arg.startsWith("--format=")) {
      format = parseFormat(arg.slice("--format=".length));
    } else if (arg.startsWith("-")) {
      throw new Error(`Unsupported option: ${arg}`);
    } else {
      positionalArgs.push(arg);
    }
  }

  return { format, positionalArgs };
}

/**
 * @param {string | undefined} value
 * @returns {"full" | "simple"}
 */
function parseFormat(value) {
  if (value === "full" || value === "simple") {
    return value;
  }
  throw new Error(`Unsupported output format: ${value ?? ""}`);
}
