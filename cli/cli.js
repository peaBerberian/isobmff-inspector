#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { parse } from "../src/main.js";

const USAGE = `Usage: isobmff-inspector <file>

Parse an ISOBMFF/MP4 file and print the parsed box tree as JSON.`;

async function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    await writeStdout(`${USAGE}\n`);
    return 0;
  }

  const positionalArgs = argv.filter((arg) => !arg.startsWith("-"));
  if (positionalArgs.length !== 1) {
    console.error(USAGE);
    return 1;
  }

  const filePath = positionalArgs[0];
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) {
    throw new Error(`${filePath} is not a file`);
  }

  const parsedBoxes = await parse(createReadStream(filePath));
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

function writeStdout(text) {
  return new Promise((resolve, reject) => {
    process.stdout.write(text, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
