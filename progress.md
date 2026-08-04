# Progress

Living checklist for the Indoor Spatial Navigation Platform, organized by system and by `techspec.md` phase/epic. **Update this file after every meaningful pass** (feature implemented, test added, decision made) — check items off, add new sub-items as scope is discovered, and keep the "Last updated" line current.

Legend: `[x]` done, `[~]` in progress / partial scaffold, `[ ]` not started.

**Last updated:** 2026-08-04 — initial scaffold pass (Phase 0 groundwork).

---

## 0. Engineering foundation (Phase 0 — `techspec.md` §17)

- [x] Monorepo layout created (`apps/`, `services/`, `packages/`, `tooling/`, `infrastructure/`, `docs/`, `tests/`)
- [x] Root `package.json` + `pnpm-workspace.yaml` + `tsconfig.base.json`
- [x] `.gitignore` (secrets, build output, production data excluded)
- [x] `README.md` with setup instructions and repo rules
- [x] ADR 0001 — initial technology choices
- [x] ADR 0002 — reference project survey
- [ ] Dependencies actually installed (`pnpm install`) — blocked, see below
- [ ] CI pipeline (lint, typecheck, unit tests, build) — not started
- [ ] Secret-scanning check in CI — not started
- [ ] Gradle wrapper generated for `platform-api` and `analytics-worker`
- [ ] Local PostGIS verified running end-to-end (`infrastructure/local/docker-compose.yml` written, not yet run)
- [ ] Environment configuration/secrets handling documented beyond `.env.example`

**Blocker:** `pnpm install` fails — `corepack prepare pnpm` hit `EPERM` against the nvm-managed Node install. User chose to skip for now. **Action needed:** fix pnpm availability before any TS package can actually build/typecheck.

---

## 1. Consumer mobile application (`apps/mobile`, `techspec.md` §5)

- [x] Expo/React Native/TypeScript shell (`App.tsx`, `app.json`, `babel.config.js`)
- [x] iOS/Android permission strings declared (location, motion, Bluetooth, camera)
- [ ] Permission request + explanation screen
- [ ] Venue detection (geofencing + backend venue bounds)
- [ ] Venue map and floor selector screen
- [ ] Search and results screen
- [ ] Destination details screen
- [ ] Route preview screen
- [ ] Active-navigation screen (marker, route polyline, confidence state, floor transition instruction)
- [ ] Position-correction screen
- [ ] Optional camera positioning screen
- [ ] Error/offline state screen
- [ ] Basic promotion placement
- [ ] Privacy and personalised-advertising controls screen
- [ ] Offline caching (venue package, route, POIs, beacon config; encrypted analytics event queue)
- [ ] Reroute-on-departure logic

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
- [x] Context-load test
- [ ] Gradle wrapper generated
- [ ] Venue/floor/POI/graph/map-version persistence (JPA entities + PostGIS mapping)
- [ ] Search indexing and ranking (`techspec.md` §11)
- [ ] Route calculation endpoint (`POST /v1/venues/{venueId}/routes`)
- [ ] Map package generation and distribution (`GET /v1/venues/{venueId}/map-package`)
- [ ] Positioning-config distribution endpoint
- [ ] Event ingestion endpoint (`POST /v1/events/batch`) — idempotent via `eventId`, batch validation
- [ ] Advertising eligibility endpoint (`GET /v1/venues/{venueId}/ads/eligible`)
- [ ] Privacy endpoints (preferences, deletion)
- [ ] Admin endpoint groups (`/v1/admin/*`) — venues, maps, POIs, graph, closures, beacons, calibration, advertisers, campaigns, analytics, audit-log
- [ ] OpenAPI 3.1 spec authored and published to `docs/api`
- [ ] Role-based authorisation (server-side, not UI-only)
- [ ] Rate limiting / payload-size limits on public ingestion endpoints
- [ ] Signed/integrity-checked map packages

### analytics-worker
- [x] Spring Boot/Kotlin shell, `application.yml`, context-load test
- [x] `AggregationJobs` scheduled-job skeleton (hourly/daily rollups, currently no-op)
- [ ] Gradle wrapper generated
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
- [x] `fixture-generator` package scaffold (`generateTwoFloorVenue` stub)
- [ ] Real map-package schema validation
- [ ] Real synthetic two-floor venue generator (needed for Phase 0/1 exit criteria and first milestone, `techspec.md` §21)
- [ ] Real replay-fixture loader + comparison reporting

---

## 10. Testing (`techspec.md` §14)

- [ ] Unit tests: step detection, heading normalisation, coordinate transforms, graph/A* correctness, constraint handling, map-matching scoring, confidence decay/recovery, event-schema validation, campaign eligibility/impression dedup
- [ ] Replay-test harness wired to `tests/positioning-replays`
- [ ] Contract tests (`tests/contract`): API client vs. OpenAPI, map-package import compatibility, event idempotency, privacy enforcement, dashboard authorisation, campaign accounting
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

- **Phase 0 — Engineering foundation:** in progress (see §0 above). Not yet exited — `pnpm install` blocker, no CI, no running local env verified.
- **Phase 1 — Map, search, and static routing:** not started (routing-core algorithm exists but no import tool, renderer, or dashboard wiring yet).
- **Phase 2 — Positioning research harness:** partially seeded (`positioning-core` has BLE/fingerprint algorithms and type contracts; no sensor abstraction, replay runner, or step/heading/PDR implementation yet).
- **Phase 3 — Beacon-assisted live navigation:** not started.
- **Phase 4 — Integrated public pilot:** not started.

## First development milestone (`techspec.md` §21)

> Open a synthetic two-floor venue, search for a destination, select a starting point, and display a correct multi-floor route generated by the backend from a versioned map managed through the dashboard.

Status: **not met**. Needs (in order): synthetic venue fixture generator → map import into `platform-api` → search endpoint → route endpoint using `routing-core` → mobile map/search/route-preview screens → dashboard map publish workflow.

---

## How to update this file

1. After implementing/testing a feature, flip its checkbox and add a one-line note if useful (date optional).
2. If new scope is discovered, add a sub-bullet under the relevant section rather than creating a new top-level section.
3. Update the **Last updated** line and add a short changelog entry below if the pass was significant.
4. Keep this file scoped to status tracking — design rationale belongs in `docs/architecture-decisions/`.

## Changelog

- **2026-08-04:** Initial scaffold pass — monorepo structure, app/service shells, spatial/routing/positioning package contracts + BLE/fingerprint algorithms, analytics-worker job skeleton, ADRs 0001–0002. `pnpm install` blocked by environment permissions issue.
