# Progress

Living checklist for the Indoor Spatial Navigation Platform, organized by system and by `techspec.md` phase/epic. **Update this file after every meaningful pass** (feature implemented, test added, decision made) — check items off, add new sub-items as scope is discovered, and keep the "Last updated" line current.

Legend: `[x]` done, `[~]` in progress / partial scaffold, `[ ]` not started.

**Last updated:** 2026-08-11 — premium Atlas mobile indoor-navigation application redesign.

---

## 0. Engineering foundation (Phase 0 — `techspec.md` §17)

- [x] Monorepo layout created (`apps/`, `services/`, `packages/`, `tooling/`, `infrastructure/`, `docs/`, `tests/`)
- [x] Root `package.json` + `pnpm-workspace.yaml` + `tsconfig.base.json`
- [x] `.gitignore` (secrets, build output, production data excluded)
- [x] `README.md` with setup instructions and repo rules
- [x] ADR 0001 — initial technology choices
- [x] ADR 0002 — reference project survey
- [x] Dependencies installed and workspace scripts running under pnpm
- [ ] CI pipeline (lint, typecheck, unit tests, build) — not started
- [ ] Secret-scanning check in CI — not started
- [x] Gradle wrapper generated for `platform-api` and `analytics-worker`
- [x] Local PostGIS verified end-to-end on isolated port 55432
- [x] Local database/admin-key configuration documented in `services/platform-api/README.md` and `.env.example`

---

## 1. Consumer mobile application (`apps/mobile`, `techspec.md` §5)

- [x] Expo/React Native/TypeScript shell (`App.tsx`, `app.json`, `babel.config.js`)
- [x] iOS/Android permission strings declared (location, motion, Bluetooth, camera)
- [x] Full-screen interactive 2D vector map with light warm-grey canvas and refined cartography
- [x] Route drawing with thick dark casing, multi-color gradient line (orange → coral → violet → blue), and rounded caps
- [x] Start glowing marker, directional accuracy halo, destination pin, and escalator/lift level badges
- [x] Floating top search bar with frosted translucent surface, placeholder, and voice search simulation
- [x] Compact floating map controls (recenter, floor selector pill, compass, venue & floor badge, confidence dot)
- [x] Persistent floating bottom navigation bar (Map, Explore, Settings) with line icons and soft shadow
- [x] Search overlay modal with category chips, recent results, voice search, and sponsored indicators
- [x] Destination preview bottom sheet (walking time, distance, step-free indicator, Start Navigation CTA)
- [x] Active turn-by-turn instruction panel (next turn direction, distance, route progress bar, step list, stop CTA)
- [x] Explore screen (nearby shops & facilities, search categories, sponsored cards, preview route on map)
- [x] Settings screen (route accessibility, dark appearance mode, voice guidance, reduced motion, permissions, offline maps)

---

## 2. Venue & advertising dashboard (`apps/venue-dashboard`, `techspec.md` §9)

- [x] Next.js/TypeScript shell (`layout.tsx`, `page.tsx`)
- [ ] Role-based authentication (`platform_admin`, `mapping_operator`, `venue_admin`, `ad_operator`, `analyst`)
- [ ] Venue management module (venue/building details, floors, map versions)
- [ ] POI/alias/category/door/status management
- [ ] Closures and restricted-edge management
- [ ] Publish/rollback workflow UI
- [ ] Change history UI
- [ ] Positioning operations module (beacon registry, health, calibration zones, field-test upload, replay/comparison)
- [ ] Advertising module (advertiser/campaign records, budgets, targeting, creative approval, sponsored-search settings, reporting)
- [ ] Analytics module (route completion, positioning quality, search demand, zone movement/dwell, ad delivery, data-quality warnings)

---

## 3. Positioning engine (`packages/positioning-core`, `techspec.md` §6)

- [x] `PositionEstimate` / `PositionSource` / `ConfidenceLevel` types
- [x] `StepDetectorConfig` + `detectSteps` stub (not implemented — returns `[]`)
- [x] BLE strategies: `nearestBeaconStrategy`, `weightedCentroidStrategy`, `trilaterationStrategy` (`src/ble.ts`)
- [x] Fingerprint k-NN matcher (`src/fingerprint.ts`)
- [x] Visual-positioning contract (`VisualPositioningProvider`, `src/visual.ts`) — contract only, no CV inference
- [ ] Step detection — real peak-detection implementation (amplitude/periodicity scoring)
- [ ] Step-length estimation (cadence/variance/calibration-walk based)
- [ ] Heading estimation (fused orientation baseline, gyro short-term rotation, magnetometer disturbance detection)
- [ ] PDR (pedestrian dead reckoning) state integration
- [ ] Floor detection (barometer/beacon/visual/user-confirmation fusion, multi-signal agreement rule)
- [ ] Map matching (candidate edge scoring: perpendicular distance, direction, continuity, route compatibility, transition legality)
- [ ] Confidence model (decay + recovery rules, tunable thresholds)
- [ ] Sensor/BLE abstraction interfaces for on-device sampling
- [ ] Deterministic replay harness wiring (see `tooling/calibration-console`)
- [ ] On-device native module decision for visual positioning (AprilTag vs. reference-image) — open decision, `techspec.md` §20

---

## 4. Spatial model & routing (`packages/spatial-model`, `packages/routing-core`, `techspec.md` §7)

- [x] Core entity types: `Venue`, `Floor`, `PointOfInterest`, `NavigationNode`, `NavigationEdge`, `MapVersion`
- [x] Graph builder (`buildGraph`) respecting `isRestricted` and directionality
- [x] A* shortest-route calculation (`findShortestRoute`)
- [ ] Coordinate-system transforms (source-plan ↔ local metres ↔ geographic)
- [ ] Floor-transition geometry and vertical-transition modeling
- [ ] Constraint application (safety, access, closure, user constraints) before graph search
- [ ] Commercial routing policy (isolated from core routing; detour caps; logging; per-venue/global disable) — `techspec.md` §7.5
- [ ] Accessibility routing (data model preserved, routing logic deferred per spec)
- [ ] Route contract validation against OpenAPI (`/v1/venues/{venueId}/routes`)

---

## 5. Spatial-data & analytics platform (`services/platform-api`, `services/analytics-worker`, `techspec.md` §8)

### platform-api
- [x] Spring Boot/Kotlin shell, Gradle build, `application.yml`, `/v1/health` endpoint
- [x] Context-load test (disabled without a live PostGIS — run manually with local compose up)
- [x] Gradle wrapper generated
- [x] Flyway `V1__initial_schema.sql` — venues, map_versions, floors, POIs/categories, nodes, edges, beacons, events_raw, audit_log
- [x] JPA entities + Spring Data repositories for all core tables
- [x] Standard error contract (`code`, `message`, `details`, `requestId`) via `@RestControllerAdvice`
- [x] Search service with §11 ranking (exact/alias/prefix/keyword relevance, availability penalty) — `GET /v1/venues/{venueId}/search`
- [x] Route calculation endpoint (`POST /v1/venues/{venueId}/routes`) — Kotlin A*, closure/restriction/one-way/validity filtering, floor segments + transitions
- [x] Map package endpoint (`GET /v1/venues/{venueId}/map-package`) — single-version consistent package
- [x] Transactional map-package import (`POST /v1/admin/map-packages/import`) — source-ID mapping, SHA-256 idempotency, rollback, persisted validation, audit log
- [x] Publication gates — floors, connected graph, routable POIs, positive costs, legal floor transitions, map-version ownership
- [x] Flyway V2 checksum uniqueness migration and corrected Hibernate JSONB bindings verified against PostGIS
- [x] Positioning-config endpoint (`GET /v1/venues/{venueId}/positioning-config`)
- [x] Event ingestion endpoint (`POST /v1/events/batch`) — idempotent via `eventId`, quarantine for bad schema/unknown venue/future timestamps; unit-tested
- [ ] Advertising eligibility endpoint (`GET /v1/venues/{venueId}/ads/eligible`)
- [ ] Privacy endpoints (preferences, deletion)
- [x] Admin endpoints: venues create/list, map-version create/publish/rollback (atomic), floors, graph bulk import + connectivity validation, closures (urgent path), POIs create/status, beacon registry
- [ ] Admin endpoints remaining: calibration, advertisers, campaigns, analytics, audit-log read API
- [x] OpenAPI via springdoc (`/v1/api-docs`, `/swagger-ui.html`) — not yet exported to `docs/api`
- [x] Role-based authorisation (server-side `@PreAuthorize` per role) with interim API-key auth — pending IdP decision (techspec.md §20)
- [ ] Rate limiting / payload-size limits on public ingestion endpoints (batch size capped at 500; no rate limiter yet)
- [ ] Signed/integrity-checked map packages

### analytics-worker
- [x] Spring Boot/Kotlin shell, `application.yml`, context-load test
- [x] `AggregationJobs` scheduled-job skeleton (hourly/daily rollups, currently no-op)
- [x] Gradle wrapper generated
- [ ] Event validation and quarantine logic
- [ ] Actual rollup queries (search demand, route completion, zone footfall, dwell, ad delivery, positioning-confidence rates)
- [ ] Venue/campaign reporting outputs consumed by dashboard

### Event catalogue
- [x] Event name catalogue + envelope types (`packages/analytics-events`)
- [ ] Server-side schema validation wired to ingestion endpoint
- [ ] Position-sampling policy enforcement (reduced precision, zone aggregation, consent retention)

---

## 6. Search & ranking (`techspec.md` §11)

- [ ] Text relevance + alias/misspelling matching
- [ ] Exact alias/name match boosting
- [ ] Venue availability filtering
- [ ] Distance-from-position ranking factor
- [ ] Popularity tie-breaker
- [ ] Sponsored-result labelling with neutral organic result always visible

---

## 7. Advertising engine (`techspec.md` §12)

- [ ] CPM commercial model implementation
- [ ] Eligibility inputs (venue/floor, proximity, query/category, session interest, cross-visit behaviour gated by consent, campaign rules)
- [ ] Impression definition enforcement (eligible + rendered + foregrounded + dedup)
- [ ] Server-side billing validation / replay protection
- [ ] Sponsored-route-influence isolation and logging (`techspec.md` §7.5)

---

## 8. Privacy & security (`techspec.md` §13)

- [ ] Installation/session identifier model (random, rotatable, no derivation from stable device IDs)
- [ ] Consent + privacy-policy-version persistence
- [ ] Deletion/reset workflow for installation-linked data
- [ ] TLS everywhere / encryption at rest
- [ ] MFA for privileged dashboard operators
- [ ] Short-lived access tokens + refresh-token handling
- [ ] Audit logging (map publication, closures, campaign changes, exports, role changes)
- [ ] Data-class access control matrix enforced in code (`techspec.md` §13.4)

---

## 9. Tooling (`tooling/`)

- [x] `map-importer` package scaffold (CLI + `validateMapPackage` stub)
- [x] `calibration-console` package scaffold (`loadFixture` stub)
- [x] `fixture-generator` package scaffold
- [x] Real map-package schema validation — Zod structural schema + full semantic rule set (cross-entity refs, bounds, geometry, connectivity, transition groups) with stable error codes; CLI `validate`/`inspect`/`canonicalize` with exit codes; canonical JSON + SHA-256 checksum; contract documented in `docs/mapping/map-package-contract.md`
- [x] Real deterministic two-floor venue generator — versioned package, admin-import payload, routable Zara + information POIs, escalator/lift transitions, invariant tests; passes map-importer validation with zero warnings
- [ ] Real replay-fixture loader + comparison reporting

---

## 10. Testing (`techspec.md` §14)

- [ ] Unit tests: step detection, heading normalisation, coordinate transforms, graph/A* correctness, constraint handling, map-matching scoring, confidence decay/recovery, event-schema validation, campaign eligibility/impression dedup
- [ ] Replay-test harness wired to `tests/positioning-replays`
- [~] Contract tests (`tests/contract`): map-package validation suite green (32 checks: valid fixture, broken refs, disconnected graph, invalid geometry, unroutable POI, missing metadata, structured issue shape, canonical JSON/checksum determinism, CLI exit codes). Remaining: API client vs. OpenAPI, event idempotency, privacy enforcement, dashboard authorisation, campaign accounting
- [ ] End-to-end tests (`tests/end-to-end`): full navigation flow, confidence/correction flow, floor transition, offline recovery, closure-aware rerouting, sponsored-search labelling
- [ ] Performance tests (`tests/performance`): route computation latency, ingestion throughput, map-package generation time
- [ ] Field-test device/carrying-state/speed/coverage matrix execution (`techspec.md` §14.5)

---

## 11. Observability (`techspec.md` §15)

- [ ] Per-session diagnostic ID propagation
- [ ] API latency/error-rate, route-computation duration, map-package failure metrics
- [ ] Mobile crash/hang tracking
- [ ] Event-queue backlog, beacon-health, confidence-distribution, correction/reroute-rate, completion/abandonment metrics
- [ ] Field-test diagnostic mode (richer logging, authorised sessions only)

---

## 12. Deployment environments (`techspec.md` §16)

- [x] `infrastructure/local/docker-compose.yml` (PostGIS)
- [ ] `development` environment fully documented/scripted
- [ ] `staging` environment
- [ ] `pilot-production` environment (backups, monitoring, audit logs, incident procedures, retention jobs)
- [ ] Automated, repeatable deployment pipeline
- [ ] Migration backup/rollback plan for production

---

## Phase exit criteria tracker (`techspec.md` §17)

- **Phase 0 — Engineering foundation:** in progress (see §0 above). Dependencies, wrappers and local PostGIS are verified; CI remains outstanding.
- **Phase 1 — Map, search, and static routing:** in progress. Package generation/validation/import, publication, search and backend multi-floor routing are verified; dashboard and mobile API integration remain.
- **Phase 2 — Positioning research harness:** partially seeded (`positioning-core` has BLE/fingerprint algorithms and type contracts; no sensor abstraction, replay runner, or step/heading/PDR implementation yet).
- **Phase 3 — Beacon-assisted live navigation:** not started.
- **Phase 4 — Integrated public pilot:** not started.

## First development milestone (`techspec.md` §21)

> Open a synthetic two-floor venue, search for a destination, select a starting point, and display a correct multi-floor route generated by the backend from a versioned map managed through the dashboard.

Status: **backend slice met**. A fresh PostGIS instance imports and publishes the synthetic venue, finds Zara, and returns a two-floor route. Remaining milestone work is dashboard-managed publication and mobile API integration on a physical device.

---

## How to update this file

1. After implementing/testing a feature, flip its checkbox and add a one-line note if useful (date optional).
2. If new scope is discovered, add a sub-bullet under the relevant section rather than creating a new top-level section.
3. Update the **Last updated** line and add a short changelog entry below if the pass was significant.
4. Keep this file scoped to status tracking — design rationale belongs in `docs/architecture-decisions/`.

## Changelog

- **2026-08-11 (Atlas mobile redesign pass):** Redesigned and rebuilt the entire `apps/mobile` frontend matching the premium Juice Lab reference UI aesthetic. Features full-screen flat 2D vector map (`MapCanvas`) on a light warm-grey canvas; multi-color gradient route drawing (orange → coral → violet → blue) with thick dark casing; start position glowing halo, accuracy cone, destination pin, and escalator/lift transition badges. Added floating translucent top search bar with voice search simulation; floating map controls (recenter, floor selector pill, compass, venue/floor badge, confidence dot); floating 3-destination bottom navigation bar (Map, Explore, Settings); destination preview bottom sheet with "Start navigation" CTA; active turn-by-turn guidance panel with distance to turn, route progress bar, expandable step list, and cancel CTA; Explore screen with category chips, shop cards, and sponsored labels; Settings screen with route accessibility preferences (avoid stairs, prefer lifts), dark appearance mode toggle, voice guidance, reduced motion, permissions, and 32MB offline venue map. TypeScript typecheck green across workspace.

- **2026-08-11 (backend import pass):** Added schema-v1 transactional package ingestion to `platform-api`, including source-ID-to-UUID mapping, cross-reference checks, SHA-256 checksum idempotency, Flyway V2 uniqueness, persisted graph validation, publication blocking, and import/validation/publication audit entries. Corrected all JSONB entity bindings after real PostGIS exposed varchar writes. Added Testcontainers PostGIS coverage for rollback, duplicates, validation gates, audit events, publication/version switching, Zara search, OpenAPI presence, and two-floor routing. Added a repeatable PowerShell flow; verified both fresh import and idempotent rerun against local PostGIS.

- **2026-08-11 (map-importer pass):** Implemented the MapPackageV1 contract end to end: versioned schema in `packages/spatial-model/src/map-package.ts`; global `GeoJSON` namespace replaced with explicit `geojson` typed imports across spatial-model and fixture-generator; Zod runtime schema (`schema.ts`) + semantic validator (`validate.ts`) covering metadata, ID uniqueness, venue/floor/node/edge/POI references, bounds, transition groups, connectivity, and geometry plausibility, all with stable structured error codes; deterministic canonical JSON + SHA-256 checksum (`canonical.ts`); CLI with `validate`/`inspect`/`canonicalize` and correct exit codes. `tests/contract` is now a workspace package with generated on-disk fixtures (valid + 5 malformed variants) and a 32-check contract suite — all green, and the fixture-generator output validates with zero warnings. Types re-exported from `@atlas/map-importer` and `@atlas/spatial-model` roots for a future API client. Contract documented in `docs/mapping/map-package-contract.md`. Also fixed workspace package entry points (`main`/`types` → `dist`) and nested-`pnpm` scripts in map-importer/fixture-generator/contract-tests.
- **2026-08-11:** Backend build-out pass on `services/platform-api`: Flyway `V1__initial_schema.sql` (venues, map versions, floors, POIs/categories, navigation nodes/edges, beacons, events_raw, audit_log); JPA entities + repositories; standard error contract; Kotlin A* `RouteService` with closure/restriction/one-way/validity filtering and floor segments/transitions (unit-tested); `SearchService` with §11 ranking; idempotent `EventIngestionService` with quarantine path (unit-tested); `MapPackageService`; public controllers (venues, floors, search, routes, map-package, positioning-config, events); admin controllers (venues, map publish/rollback, floors, graph bulk import + connectivity validation, closures, POIs, beacons) with role-gated `@PreAuthorize` and interim API-key auth; springdoc OpenAPI wired. Gradle wrappers generated for both services; `compileKotlin`/`test` green. Also created `agentconvo.md` for inter-agent coordination.
- **2026-08-07:** Redesigned the fixture-driven mobile prototype around a dark, map-first indoor cartography system. Expanded the schematic venue to a coherent atrium/concourse plan with 14+ tenant footprints, facilities, transition cores, doorway-specific Zara endpoint, map grid, chartreuse route, cyan position treatment, floating controls, phone-width web canvas, and mature light-theme counterpart. Follow-up browser QA corrected flex-growing buttons, route-preview clipping, search result columns, map-backed search, action contrast, overlay collisions, web landmarks, and centered graphite tablet/desktop framing. The existing search, navigation, correction, offline, and supporting-state functionality remains deterministic and local.
- **2026-08-06:** Replaced the mobile placeholder with a deterministic Sandton City consumer prototype: native two-floor schematic map, neutral and sponsored Zara search results, destination and route preview, active guidance, floor transition, confidence correction/reroute, arrival, and supporting offline/alert/report/privacy/camera/light/dark states. This is fixture-driven UI only; it does not claim live positioning, camera recognition, backend routing, or production GIS rendering. Dependency installation remains incomplete because the package mirror is missing `xtend` metadata.
- **2026-08-04:** Initial scaffold pass — monorepo structure, app/service shells, spatial/routing/positioning package contracts + BLE/fingerprint algorithms, analytics-worker job skeleton, ADRs 0001–0002. `pnpm install` blocked by environment permissions issue.
