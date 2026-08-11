import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateTwoFloorVenuePackage } from "./index";

async function main(): Promise<void> {
  const outputFlagIndex = process.argv.indexOf("--output");
  const outputPath = outputFlagIndex >= 0 ? process.argv[outputFlagIndex + 1] : undefined;
  const json = `${JSON.stringify(generateTwoFloorVenuePackage(), null, 2)}\n`;
  if (outputPath) {
    const absolutePath = resolve(outputPath);
    await writeFile(absolutePath, json, "utf8");
    process.stdout.write(`${absolutePath}\n`);
    return;
  }
  process.stdout.write(json);
}

void main();
