// MapPackageV1 — the versioned, self-contained artifact exchanged between
// map production tooling and the platform backend (techspec.md §7.3, §9.3).
//
// A package pins one venue, one map version, and every floor/POI/node/edge
// belonging to that version, so a client or the backend can ingest an
// internally consistent bundle and never a mixture of versions.
//
// Compatibility rule: additive changes only within schemaVersion 1; bump
// schemaVersion for breaking changes. The same rule as packages/spatial-model.

import type { Floor, MapVersion, NavigationEdge, NavigationNode, PointOfInterest, Venue } from "./index";

export const MAP_PACKAGE_SCHEMA_VERSION = 1 as const;

export interface MapPackageV1 {
  schemaVersion: typeof MAP_PACKAGE_SCHEMA_VERSION;
  venue: Venue;
  mapVersion: MapVersion;
  floors: Floor[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  pois: PointOfInterest[];
}

/** Stable content identifier: SHA-256 over the canonical JSON (see tooling/map-importer). */
export interface MapPackageChecksum {
  algorithm: "sha256";
  canonical: "json";
  value: string;
}
