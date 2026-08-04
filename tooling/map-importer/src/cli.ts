#!/usr/bin/env node
// CLI entry point for validating/importing a map package.
// Usage: pnpm --filter @atlas/map-importer exec ts-node src/cli.ts <path>

import { validateMapPackage } from "./index";

const [, , inputPath] = process.argv;

if (!inputPath) {
  console.error("Usage: map-importer <path-to-map-package>");
  process.exit(1);
}

const result = validateMapPackage(inputPath);
console.log(JSON.stringify(result, null, 2));
process.exit(result.valid ? 0 : 1);
