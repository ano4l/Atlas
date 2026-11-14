#!/usr/bin/env node
// CLI for map-package validation and canonicalization.
//   map-importer validate <package.json>            structural + semantic validation, JSON report
//   map-importer inspect <package.json>             package summary + checksum
//   map-importer canonicalize <input> --output <f>  write canonical JSON (+ checksum to stdout)
// Exit codes: 0 success (warnings allowed), 1 validation/usage failure.

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { canonicalPackageJson, checksumPackage, validateMapPackage } from "./index";
import type { MapPackageV1 } from "@atlas/spatial-model";
import type { ValidationIssue } from "./validate";
import { runOperator } from "./operator";

function usage(): never {
  console.error(
    [
      "Usage:",
      "  map-importer validate <package.json>",
      "  map-importer inspect <package.json>",
      "  map-importer canonicalize <input.json> --output <file>",
      "  map-importer operator <venues|import|versions|validate|publish|rollback|closure> [arguments]",
    ].join("\n"),
  );
  process.exit(1);
}

function readPackage(path: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error(`Cannot read file: ${path}`);
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Invalid JSON in ${path}: ${(error as Error).message}`);
    process.exit(1);
  }
}

function printIssues(issues: ValidationIssue[]): void {
  for (const issue of issues) {
    const source = issue.sourceId ? ` [${issue.sourceId}]` : "";
    console.error(`${issue.severity.toUpperCase()} ${issue.code} ${issue.entityType}${source} at ${issue.path}: ${issue.message}`);
  }
}

const [, , command, inputPath, ...rest] = process.argv;

switch (command) {
  case "operator": {
    runOperator(process.argv.slice(3)).catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
    break;
  }
  case "validate": {
    if (!inputPath || rest.length > 0) usage();
    const result = validateMapPackage(readPackage(inputPath));
    printIssues([...result.errors, ...result.warnings]);
    console.log(JSON.stringify({ valid: result.valid, errors: result.errors, warnings: result.warnings }, null, 2));
    process.exit(result.valid ? 0 : 1);
    break;
  }
  case "inspect": {
    if (!inputPath || rest.length > 0) usage();
    const result = validateMapPackage(readPackage(inputPath));
    if (!result.valid || !result.package) {
      printIssues(result.errors);
      console.error("Package failed validation; inspect requires a valid package (run `validate` for the full report).");
      process.exit(1);
    }
    const pkg: MapPackageV1 = result.package;
    const checksum = checksumPackage(pkg);
    console.log(
      JSON.stringify(
        {
          file: basename(inputPath),
          schemaVersion: pkg.schemaVersion,
          venue: { id: pkg.venue.id, slug: pkg.venue.slug, name: pkg.venue.name },
          mapVersion: { id: pkg.mapVersion.id, version: pkg.mapVersion.version, status: pkg.mapVersion.status },
          counts: {
            floors: pkg.floors.length,
            nodes: pkg.nodes.length,
            edges: pkg.edges.length,
            pois: pkg.pois.length,
          },
          warnings: result.warnings.length,
          checksum,
        },
        null,
        2,
      ),
    );
    if (result.warnings.length > 0) printIssues(result.warnings);
    process.exit(0);
    break;
  }
  case "canonicalize": {
    const outputIndex = rest.indexOf("--output");
    const outputPath = outputIndex >= 0 ? rest[outputIndex + 1] : undefined;
    if (!inputPath || outputIndex < 0 || !outputPath) usage();
    const result = validateMapPackage(readPackage(inputPath));
    if (!result.valid || !result.package) {
      printIssues(result.errors);
      console.error("Refusing to canonicalize an invalid package (run `validate` for the full report).");
      process.exit(1);
    }
    const canonical = canonicalPackageJson(result.package);
    writeFileSync(outputPath, `${canonical}\n`, "utf8");
    console.log(JSON.stringify({ output: outputPath, checksum: checksumPackage(result.package) }, null, 2));
    process.exit(0);
    break;
  }
  default:
    usage();
}
