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

Use `--scenario <name>` with the generator to create a specific test map. The venue, floor and destination source IDs stay stable across valid variants. Each variant has a distinct authoring map ID and checksum. The backend assigns the published version number on import.

| Scenario | Change to the baseline |
| --- | --- |
| `closed-corridor` | Expire the west entrance corridor's validity window |
| `unavailable-lift` | Expire the lift's validity window |
| `closed-destination` | Close Zara |
| `one-way-corridor` | Limit the direct ground-floor corridor to east-to-atrium travel. Atrium-to-east trips use the gallery. |
| `inaccessible-route` | Keep the lift available to standard routes and mark it unsuitable for step-free routes |
| `version-update` | Add a Zara search alias |
| `curved-corridor` | Add bends to the west entrance corridor and test the route shape and walking distance |
| `scheduled-route` | Give the west corridor and lift different closing times to verify the route expires at the earlier cutoff |
| `invalid-disconnected` | Add an isolated graph node that fails validation with `NODE_UNREACHABLE` |

The expiry variants use a fixed timestamp, 12 August 2026 at 00:00 UTC. Run those scenarios after that timestamp to exercise unavailable routes.

## Structure

TypeScript source of truth: `packages/spatial-model/src/map-package.ts` (`MapPackageV1`), built from the §7.3 entity interfaces in `packages/spatial-model/src/index.ts`. Runtime schema: `tooling/map-importer/src/schema.ts` (Zod).

### Consumer route preview

The authoring package goes to the import endpoint. The mobile client reads the published response at `GET /v1/venues/{venueId}/map-package`, where nodes and edges are grouped under `graph` and each destination has one `entryPointNodeId`. The published response uses server IDs assigned at import. The mobile client validates this response at runtime and uses its `mapVersion.id` for both search and routing. Search result IDs resolve to that package's directory. Route segments must start at the selected entrance and finish at the destination's entrance node. Each floor change must join the mapped endpoints of a public connection with the declared type and permitted direction. Step-free previews and reroutes require a step-free connection. Closure and validity decisions use the API at request time or the saved package when routing offline.

Floor bounds are `[minX, minY, maxX, maxY]` in local metres. The fictional fixture has positive X to the right and positive Y down. The renderer subtracts the floor's minimum X and Y and multiplies by two to get display coordinates. Requests send the original metre coordinates. Bounds and graph geometry may be JSON-encoded strings in the published response. Same-floor graph lines provide the fictional walkway drawing and entrance nodes provide destination dots. The authoring fixture's shop polygons are outside this consumer preview.

The offline snapshot stores the complete published payload and its sync time in one AsyncStorage record. It requires every edge to carry a positive `baseCostM`, direction, closure state and nullable `validFrom`/`validUntil` bounds. Older API responses without these fields can still open online. Both route engines minimize edge cost and exclude restricted, closed and out-of-window edges for a standard public preview. For each selected same-floor edge they use its authored line in travel order, anchor the endpoints to the graph nodes and sum the lengths of the resulting segments. Missing or unusable geometry falls back to a straight line. The app applies saved validity windows to walkway and lift visibility, route previews and simulated detours. Both bounds are inclusive. The app refreshes the map when it returns to the foreground or crosses a saved boundary. Remote changes to closure state reach the app when it syncs.

For `mode: "step_free"`, both route engines require affirmative accessibility metadata on every edge and exclude stairs and escalators. Import carries this through the source edge's `isAccessible` field and the published package exposes `isStepFree`. Older imports without that information require republication from a source package with accessibility data before step-free guidance is available.

The optional route field `validUntilMs` is the earliest selected edge cutoff, as Unix epoch milliseconds. A missing or null value means no scheduled cutoff was reported. Atlas treats a route as expired after that timestamp, refreshes its preview, and pauses an active simulation until the user supplies a position for a replacement route.

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
