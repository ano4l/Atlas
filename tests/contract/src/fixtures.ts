// Builds the on-disk contract fixtures: one valid package plus malformed
// variants covering broken references, disconnected graphs, invalid geometry,
// and unroutable POIs. Deterministic — same input fixture, same output files.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateTwoFloorVenuePackage } from "@atlas/fixture-generator";

const fixturesDir = join(__dirname, "..", "fixtures");

type PackageJson = Record<string, unknown>;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function write(name: string, pkg: PackageJson): void {
  writeFileSync(join(fixturesDir, name), `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

export function generateFixtures(): void {
  mkdirSync(fixturesDir, { recursive: true });
  const valid = deepClone(generateTwoFloorVenuePackage()) as unknown as PackageJson;

  write("valid.json", valid);

  // Broken references: edge -> unknown node, POI -> unknown floor.
  const brokenReferences = deepClone(valid);
  const edges = brokenReferences.edges as Array<Record<string, unknown>>;
  edges[0].toNodeId = "99999999-9999-4999-8999-999999999999";
  const pois = brokenReferences.pois as Array<Record<string, unknown>>;
  pois[0].floorId = "88888888-8888-4888-8888-888888888888";
  write("broken-references.json", brokenReferences);

  // Disconnected graph: remove all edges touching one node.
  const disconnected = deepClone(valid);
  const isolatedNodeId = "30000000-0000-4000-8000-000000000003"; // groundEast
  const keptEdges = (valid.edges as Array<Record<string, unknown>>)
    .filter((e) => e.fromNodeId !== isolatedNodeId && e.toNodeId !== isolatedNodeId)
    .map((e) => deepClone(e));
  disconnected.edges = keptEdges;
  write("disconnected-graph.json", disconnected);

  // Invalid geometry: non-finite coordinate + wrong geometry type + unclosed ring.
  const invalidGeometry = deepClone(valid);
  const geoEdges = invalidGeometry.edges as Array<Record<string, unknown>>;
  const geometry = geoEdges[0].geometry as { type: string; coordinates: number[][] };
  geometry.coordinates[1][0] = Number.NaN;
  const geoPois = invalidGeometry.pois as Array<Record<string, unknown>>;
  const space = geoPois[0].spaceGeometry as { type: string; coordinates: number[][][] };
  space.type = "MultiPolygon";
  write("invalid-geometry.json", invalidGeometry);

  // Unroutable POI: entrance node on a different floor than the POI.
  const unroutable = deepClone(valid);
  const unroutablePois = unroutable.pois as Array<Record<string, unknown>>;
  // Zara is on levelOne; point its entrance at a ground-floor node.
  unroutablePois[0].entranceNodeIds = ["30000000-0000-4000-8000-000000000001"];
  write("unroutable-poi.json", unroutable);

  // Structural break: missing required metadata.
  const missingMetadata = deepClone(valid);
  delete missingMetadata.schemaVersion;
  delete (missingMetadata.mapVersion as Record<string, unknown>).contentHash;
  write("missing-metadata.json", missingMetadata);
}

generateFixtures();
