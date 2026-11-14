// Contract tests for the MapPackageV1 validation contract (techspec.md §14.3).
// Asserts the fixture-generator output is a valid backend-ready artifact, and
// that every malformed fixture fails with the expected stable error codes.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { generateTwoFloorVenuePackage, syntheticVenueScenarios } from "@atlas/fixture-generator";
import { canonicalPackageJson, checksumPackage, validateMapPackage } from "@atlas/map-importer";

let failures = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, "..", "fixtures", name), "utf8"));
}

function codesOf(result: ReturnType<typeof validateMapPackage>): string[] {
  return [...result.errors, ...result.warnings].map((issue) => issue.code);
}

// --- Valid synthetic package passes cleanly ---
const generated = generateTwoFloorVenuePackage();
const generatedResult = validateMapPackage(generated);
check("generated package is valid", generatedResult.valid,
  generatedResult.errors.map((e) => `${e.code}: ${e.message}`).join("; "));
check("generated package has no warnings", generatedResult.warnings.length === 0,
  generatedResult.warnings.map((w) => `${w.code}: ${w.message}`).join("; "));

const validFromDisk = validateMapPackage(loadFixture("valid.json"));
check("fixtures/valid.json is valid", validFromDisk.valid,
  validFromDisk.errors.map((e) => `${e.code}: ${e.message}`).join("; "));
check("fixtures/valid.json has no warnings", validFromDisk.warnings.length === 0,
  validFromDisk.warnings.map((w) => `${w.code}: ${w.message}`).join("; "));

// --- Malformed fixtures fail with expected codes ---
const brokenReferences = validateMapPackage(loadFixture("broken-references.json"));
check("broken-references fails", !brokenReferences.valid);
check("broken-references reports EDGE_UNKNOWN_NODE", codesOf(brokenReferences).includes("EDGE_UNKNOWN_NODE"));
check("broken-references reports POI_UNKNOWN_FLOOR", codesOf(brokenReferences).includes("POI_UNKNOWN_FLOOR"));

const disconnected = validateMapPackage(loadFixture("disconnected-graph.json"));
check("disconnected-graph fails", !disconnected.valid);
check("disconnected-graph reports NODE_UNREACHABLE", codesOf(disconnected).includes("NODE_UNREACHABLE"));

const invalidGeometry = validateMapPackage(loadFixture("invalid-geometry.json"));
check("invalid-geometry fails", !invalidGeometry.valid);
check("invalid-geometry reports a geometry schema error",
  codesOf(invalidGeometry).some((code) => code.startsWith("SCHEMA_")));

const unroutablePoi = validateMapPackage(loadFixture("unroutable-poi.json"));
check("unroutable-poi fails", !unroutablePoi.valid);
check("unroutable-poi reports POI_ENTRANCE_WRONG_FLOOR", codesOf(unroutablePoi).includes("POI_ENTRANCE_WRONG_FLOOR"));

const missingMetadata = validateMapPackage(loadFixture("missing-metadata.json"));
check("missing-metadata fails", !missingMetadata.valid);
check("missing-metadata reports schema errors", codesOf(missingMetadata).some((code) => code.startsWith("SCHEMA_")));

// --- In-memory mutations (NaN survives, unlike JSON fixtures) ---
const nanPackage = JSON.parse(JSON.stringify(generated));
nanPackage.edges[0].geometry.coordinates[1][0] = NaN;
const nanResult = validateMapPackage(nanPackage);
check("non-finite coordinate fails", !nanResult.valid);

const duplicateNodeId = JSON.parse(JSON.stringify(generated));
duplicateNodeId.nodes[1].id = duplicateNodeId.nodes[0].id;
const dupResult = validateMapPackage(duplicateNodeId);
check("duplicate node id fails", !dupResult.valid);
check("duplicate node id reports DUPLICATE_ID", codesOf(dupResult).includes("DUPLICATE_ID"));

const unsupported = JSON.parse(JSON.stringify(generated));
unsupported.schemaVersion = 99;
const unsupportedResult = validateMapPackage(unsupported);
check("unsupported schemaVersion fails", !unsupportedResult.valid);

const selfLoop = JSON.parse(JSON.stringify(generated));
selfLoop.edges[0].toNodeId = selfLoop.edges[0].fromNodeId;
const selfLoopResult = validateMapPackage(selfLoop);
check("self-loop edge fails", !selfLoopResult.valid);
check("self-loop reports EDGE_SELF_LOOP", codesOf(selfLoopResult).includes("EDGE_SELF_LOOP"));

// --- Structured error shape ---
const sample = brokenReferences.errors[0];
check("issues carry stable code", typeof sample.code === "string" && sample.code.length > 0);
check("issues carry entity type", typeof sample.entityType === "string" && sample.entityType.length > 0);
check("issues carry JSON path", typeof sample.path === "string" && sample.path.length > 0);
check("issues carry a message", typeof sample.message === "string" && sample.message.length > 0);

// --- Canonical JSON + checksum determinism ---
if (generatedResult.package) {
  const canonicalA = canonicalPackageJson(generatedResult.package);
  const shuffled = JSON.parse(JSON.stringify(generated, (key, value) =>
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).reverse())
      : value,
  ));
  const shuffledResult = validateMapPackage(shuffled);
  check("key-reordered package still validates", shuffledResult.valid);
  if (shuffledResult.package) {
    const canonicalB = canonicalPackageJson(shuffledResult.package);
    check("canonical JSON is key-order independent", canonicalA === canonicalB);
  }
  const checksum = checksumPackage(generatedResult.package);
  check("checksum is sha256 hex", /^[0-9a-f]{64}$/.test(checksum.value));
  check("checksum is stable", checksumPackage(generatedResult.package).value === checksum.value);
} else {
  check("parsed package available for canonical tests", false);
}

// --- CLI exit codes (spawns the compiled CLI) ---
const scenarioChecksums = new Set<string>();
for (const scenario of syntheticVenueScenarios) {
  const validation = validateMapPackage(generateTwoFloorVenuePackage(scenario));
  if (scenario === "invalid-disconnected") {
    check("disconnected generated scenario is invalid",
      !validation.valid && validation.errors.some((issue) => issue.code === "NODE_UNREACHABLE"));
  } else {
    check(`${scenario} is a valid authoring scenario`, validation.valid);
    if (validation.package) scenarioChecksums.add(checksumPackage(validation.package).value);
  }
}
check("valid scenario checksums are distinct", scenarioChecksums.size === syntheticVenueScenarios.length - 1);

const cliPath = join(__dirname, "..", "..", "..", "tooling", "map-importer", "dist", "cli.js");
function runCli(args: string[]): { status: number } {
  try {
    execFileSync(process.execPath, [cliPath, ...args], { stdio: "pipe" });
    return { status: 0 };
  } catch (error) {
    return { status: (error as { status?: number }).status ?? 1 };
  }
}

check("CLI validate valid.json exits 0", runCli(["validate", join(__dirname, "..", "fixtures", "valid.json")]).status === 0);
check("CLI validate broken-references.json exits 1", runCli(["validate", join(__dirname, "..", "fixtures", "broken-references.json")]).status === 1);
check("CLI inspect valid.json exits 0", runCli(["inspect", join(__dirname, "..", "fixtures", "valid.json")]).status === 0);
check("CLI with no args exits 1", runCli([]).status === 1);

if (failures > 0) {
  console.error(`\n${failures} contract check(s) failed`);
  process.exit(1);
}
console.log("\nAll contract checks passed");
