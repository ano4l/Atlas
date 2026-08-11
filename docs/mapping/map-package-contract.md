# Map package contract (MapPackageV1)

The versioned artifact exchanged between map production tooling and the platform backend (techspec.md §7.3, §9.3). A package pins **one venue, one map version**, and every floor/POI/node/edge of that version, so consumers always ingest an internally consistent bundle — never a mixture of graph and POI versions.

## Producing and checking a package

```bash
# Generate the synthetic two-floor venue (fixture-generator)
corepack pnpm --filter @atlas/fixture-generator generate:synthetic-venue -- --output package.json

# Validate (exit 0 = safe to send to the backend; warnings allowed)
corepack pnpm --filter @atlas/map-importer validate -- package.json

# Summarize + checksum
corepack pnpm --filter @atlas/map-importer inspect -- package.json

# Write deterministic canonical JSON (+ SHA-256 checksum)
corepack pnpm --filter @atlas/map-importer canonicalize -- package.json --output package.canonical.json
```

Regenerate the contract fixtures after intentional schema changes:

```bash
corepack pnpm --filter @atlas/contract-tests generate-fixtures
corepack pnpm --filter @atlas/contract-tests test
```

## Structure

TypeScript source of truth: `packages/spatial-model/src/map-package.ts` (`MapPackageV1`), built from the §7.3 entity interfaces in `packages/spatial-model/src/index.ts`. Runtime schema: `tooling/map-importer/src/schema.ts` (Zod).

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | `1` (literal) | Only version 1 is supported; bump on breaking changes |
| `venue` | `Venue` | `defaultMapVersionId` must be null or the packaged `mapVersion.id` |
| `mapVersion` | `MapVersion` | `venueId` must match `venue.id`; `contentHash` required |
| `floors` | `Floor[]` (≥1) | All `venueId` must match the package venue; `localBounds` is `[minX, minY, maxX, maxY]` in local metres |
| `nodes` | `NavigationNode[]` | `floorId` must reference a packaged floor; coordinates must fall within that floor's `localBounds` |
| `edges` | `NavigationEdge[]` | Both endpoints must reference packaged nodes; `geometry` is a GeoJSON `LineString` in local metres starting/ending at its endpoint nodes (±1 m tolerance, warning) |
| `pois` | `PointOfInterest[]` | `floorId` must reference a packaged floor; every entrance node must exist **on the same floor** |

## Semantic rules (enforced by `tooling/map-importer`)

Errors (fail validation) — stable codes, never renumber or rename released codes:

| Code | Meaning |
|---|---|
| `UNSUPPORTED_SCHEMA_VERSION` | Package or mapVersion schemaVersion ≠ 1 |
| `MAP_VERSION_VENUE_MISMATCH` | Map version belongs to a different venue |
| `DEFAULT_MAP_VERSION_MISMATCH` | Venue default points at a different version |
| `DUPLICATE_ID` | Repeated ID within an entity collection |
| `FLOOR_VENUE_MISMATCH` / `POI_VENUE_MISMATCH` | Entity belongs to a different venue |
| `NODE_UNKNOWN_FLOOR` | Node references an unpackaged floor |
| `NODE_OUT_OF_BOUNDS` | Node outside its floor's `localBounds` |
| `EDGE_UNKNOWN_NODE` | Edge endpoint references an unpackaged node |
| `EDGE_SELF_LOOP` | Edge connects a node to itself |
| `CROSS_FLOOR_EDGE_NOT_TRANSITION` | Cross-floor edge without a transition edgeType (`stairs`/`escalator`/`lift`/`ramp`) |
| `TRANSITION_NODE_WITHOUT_GROUP` | `transition` node missing `transitionGroupId` |
| `TRANSITION_GROUP_SINGLE_FLOOR` | Transition group spans fewer than 2 floors |
| `POI_UNKNOWN_FLOOR` | POI references an unpackaged floor |
| `POI_WITHOUT_ENTRANCE` | POI has no entrance nodes (unroutable) |
| `POI_UNKNOWN_ENTRANCE_NODE` | Entrance references an unpackaged node |
| `POI_ENTRANCE_WRONG_FLOOR` | Entrance node on a different floor than the POI |
| `POI_UNROUTABLE` | No entrance node in the reachable graph |
| `POI_GEOMETRY_NOT_CLOSED` | POI polygon ring not closed |
| `EDGE_GEOMETRY_TOO_SHORT` | Fewer than 2 positions |
| `GEOMETRY_NON_FINITE` | Non-finite coordinate (also caught structurally) |
| `GRAPH_EMPTY` | No navigation nodes |
| `NODE_UNREACHABLE` | Node disconnected from the main graph component |
| `SCHEMA_*` | Structural failures from the Zod layer (type/enum/format/size) |

Warnings (validation still passes):

| Code | Meaning |
|---|---|
| `EDGE_SUSPICIOUSLY_LONG` | Single edge > 250 m — sanity threshold for indoor segments |
| `EDGE_GEOMETRY_START_MISMATCH` / `EDGE_GEOMETRY_END_MISMATCH` | Geometry endpoints > 1 m from endpoint nodes |
| `EDGE_DISTANCE_MISMATCH` | Declared `distanceM` differs from polyline length by > 25% |
| `TRANSITION_EDGE_SAME_FLOOR` | Transition-typed edge within one floor |
| `CROSS_FLOOR_EDGE_WITHOUT_GROUPS` | Cross-floor edge whose endpoints lack transition groups |
| `NON_TRANSITION_NODE_IN_GROUP` | Non-transition node carrying a `transitionGroupId` |
| `POI_DUPLICATE_ALIAS` | Same alias on multiple POIs |
| `POI_CLOSED` | Permanently closed POI |
| `POI_ISOLATED` | Entrance nodes have no connecting edges |

## Canonical JSON and checksum

`canonicalPackageJson` sorts object keys lexicographically at every depth, preserves array order, and emits no insignificant whitespace. `checksumPackage` is SHA-256 over that canonical string — identical packages produce identical checksums regardless of source key ordering, giving the backend an idempotency key for re-imports.

## Issue shape

Every finding is structured for CI and the mapping dashboard:

```json
{
  "code": "EDGE_UNKNOWN_NODE",
  "severity": "error",
  "entityType": "edge",
  "sourceId": "60000000-0000-4000-8000-000000000001",
  "path": "edges[3].fromNodeId",
  "message": "Edge … references unknown from-node …"
}
```

## Consumer types

`@atlas/spatial-model` exports all entity types plus `MapPackageV1`, `MapPackageChecksum`, and `MAP_PACKAGE_SCHEMA_VERSION`. `@atlas/map-importer` re-exports them together with `validateMapPackage`, `canonicalPackageJson`, `checksumPackage`, and the `ValidationIssue`/`ValidationReport` types — the intended import surface for a future generated API client.
