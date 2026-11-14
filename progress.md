# Progress

Living checklist for the Indoor Spatial Navigation Platform, organized by system and by `techspec.md` phase/epic. **Update this file after every meaningful pass** (feature implemented, test added, decision made) — check items off, add new sub-items as scope is discovered, and keep the "Last updated" line current.

Legend: `[x]` done, `[~]` in progress / partial scaffold, `[ ]` not started.

**Last updated:** 2026-11-13 — Verified route floor changes against mapped connections.

## Active development roadmap (2026-11-12)

The [indoor navigation roadmap](docs/indoor-navigation-roadmap.md) defines the immediate sequence through a synthetic-venue beta. Its P0–P6 execution stages map to the existing specification phases; this planning pass does not complete implementation milestones.

- [x] Assessed current source and documented the map-free endpoint, dependencies, acceptance gates, provider evaluation and ordered first iteration backlog.
- [x] Current mobile typecheck and regression suite passed: 284 schematic route combinations plus map viewport, camera and place-memory checks. All 32 map-package contract checks passed.
- [x] First implementation slice: pinned root workspace commands to Corepack pnpm, generated 20 destinations and three starting entrances, and added a map/search/route preview backed by the published API contract. Client checks exercise version pinning, both floors, exact endpoints and invalid responses. Android JavaScript bundle export passed.
- [x] Save a published fictional map and provide offline search and routing when the API is unreachable. Added client checks for saved package validation, alias search, restricted/closed/expired edges and one-way traversal.
- [x] Connect the step-free preference to online and offline routes. Explicitly marked lift and walkway edges can participate. Both engines exclude stairs and escalators in this mode.
- [x] Implement positioning observation types and deterministic replay with 12 seeded synthetic scenarios. Compare last-fix and step/heading estimates, including floor errors, manual correction and late observations.
- [x] Add the platform-independent recorder with an injected monotonic clock, sample cap and unlabelled replay export. Mobile sensor integration remains open.
- [x] Add an opt-in Settings recorder with motion permission handling, accelerometer and optional pressure capture, automatic foreground cleanup and JSON export. Physical-device capture and sharing remain to be tested.
- [x] Record numbered checkpoint times and pair them with separately measured coordinates during replay. Tests verify ordering, invalid marks, and that measured checkpoints never become estimator fixes. Physical-device collection remains open.
- [x] Replay a walk using a tester-provided start and direction schedule. A synthetic corner regression verifies lower endpoint error than the last-fix baseline while keeping the endpoint out of the estimator inputs. Independently measured walks remain open.
- [x] Replay position estimates through the mobile route-progress engine. The report includes turns, floor confirmation decisions, uncertainty, remaining distance and arrival time. Tests verify early confirmation rejection, a retained floor prompt and arrival after a valid confirmation.
- [x] Track motion and fix capture time during replay. Guidance rejects stale estimates and ignores duplicates. Tests exercise lost updates near arrival, recovery with fresh samples and off-route dwell.
- [x] Report correction capture and receipt times and time to resume guidance. Synthetic checks cover a wrong floor, an off-route position, a delayed correction and a stale correction that does not recover.
- [x] Add a repeatable offline routing benchmark using the published package. Reuse static graphs and index destinations and floor nodes. Scheduled edges still use request-time validity checks. The repeated 954-case PostGIS comparison passed after correcting the test to handle idempotent imports.
- [x] Follow authored bends in the route overlay, distance, time estimate and simulated guidance. Added a curved corridor to the PostGIS matrix. All 1,074 comparisons agreed across nine conditions, including 130 expected no-route results.
- [x] Add an initial corridor matcher to replay and test raw-estimate preservation, confidence, ambiguous parallel corridors and disconnected segments.
- [x] Exercise bounded BLE corrections, radio outlier rejection and tentative floor suggestions in 18 synthetic scenarios on two seeds.
- [x] Add a route progress engine and wire it into the fictional venue simulation. Tests cover turns, explicit floor confirmation, arrival, uncertain position and off-route recovery.
- [x] Exercise automatic rerouting from a mapped node in the fictional missed-turn flow. Test network fallback, a closed branch, a one-way dead end and preservation of step-free routing.
- [x] Follow curved branches in missed-turn simulation. Software checks cover authored geometry in either direction, branch eligibility, off-route dwell at the endpoint and offline recovery along the same corridor after a network failure.
- [x] Hold route progress when nearby corridors are equally plausible. Limit forward and backward jumps while allowing gradual backtracking. Synthetic checks cover false arrival near a folded route's endpoint, sustained off-route evidence and recovery when the position becomes clear.
- [x] Add manual position correction to a mapped entrance during the simulation. The selected entrance supplies both the floor and starting coordinates for the replacement route.
- [x] Generate printable entrance checkpoints from the published package and wire QR scanning into the same simulated correction flow. Automated checks cover both floors, invalid codes and print output. Android and iOS JavaScript bundles export successfully.
- [x] Add a CI workflow for workspace lint, type checking, tests and builds, API checks with PostGIS, and Git history secret scanning. Local actionlint, secret scan, workspace tests and eight API unit tests passed. The GitHub-hosted workflow still needs a run.
- [x] Verify API and offline route parity against local PostGIS for the baseline, live lift closure and six generated variants. All 954 comparisons agreed, including 130 expected no-route results. The run restored the baseline map and reopened the lift. Hosted CI remains pending.
- [x] Restore a custom-format backup into a fresh local PostGIS database and verify publication, closure and audit state. The API reused the restored package and returned the same two-floor route to Zara.
- [x] Verify the mobile cache coordinator preserves the last valid snapshot after failed, invalid or cancelled writes using a test storage adapter. Baseline route parity still passed for 120 live PostGIS comparisons. Native storage restart remains unverified.
- [x] Exercise the app's venue loader with a disk-backed test cache. Reopen offline, search by alias and plan a two-floor step-free route. Verify stale sync time, invalid and interrupted updates, successful publication and rollback, and rejection of corrupt or incompatible snapshots.
- [x] Apply saved schedules to corridor and lift visibility and refresh route previews at availability changes. Software checks verify the inclusive opening and closing boundaries, including the same cutoff for simulated detours.
- [x] Carry the earliest selected edge cutoff in API and offline routes. Pause simulated guidance when a selected route or detour expires and allow checkpoint correction to request a replacement. All 1,194 PostGIS comparisons agreed across ten conditions, including a step-free route that expires when its lift closes.
- [x] Validate every floor change against the mapped endpoints, transition type, travel direction and step-free metadata. All 1,064 successful routes in the 1,194-case PostGIS matrix passed the mobile adapter. Focused tests cover shifted floor origins and invalid or restricted connections.
- [~] Run the updated publish/search/route flow against local PostGIS and exercise it in the Android app. The backend flow passed against an isolated Windows PostgreSQL 16.16 and PostGIS 3.4.2 database. Android connected runtime verification remains open.
- [~] P0: dashboard upgraded to Next.js 16 and aligned with the mobile workspace's React version. Frozen install, workspace lint, type checking, tests and production build passed in an isolated Windows workspace after clearing stale TypeScript launchers from the previous install. GitHub-hosted execution remains pending.
- [~] P1: added deterministic variants for corridor and lift outages, a closed destination, one-way travel, step-free restrictions and a map update. Contract tests validate all six variants and reject the disconnected negative case. All six valid variants passed the live PostGIS scenario matrix.
- [~] P2: added an authenticated operator CLI for map import, validation, publication, rollback and closures. All seven commands passed loopback HTTP verification. The live PostGIS flow verified import, publication, closures, rollback and route parity. Native offline restart and the Docker-based integration test remain open.
- [~] P3: recording core, Settings capture/export and deterministic replay implemented. The recorder can derive a vertical signal from paired DeviceMotion readings, with an accelerometer fallback. OpenHPS reports a separate step count when vertical coverage is complete. The original comparison ran on six synthetic cases with two seeds. A measured phone walk and native adapter verification remain open.
- [~] P4: initial step and heading estimator, manual fixes, corridor matching and bounded BLE/floor evidence exercised in replay. Hardware integration and measured evidence remain open.
- [~] P5: estimate-driven progress, explicit floor confirmation, automatic rerouting and manual/QR correction implemented in the fictional venue simulation. Live guidance and physical-device scanning remain open.
- [~] P6: API failures return a request reference that can be matched to service logs. The mobile Settings report keeps up to 40 failures or offline fallbacks in memory for 30 minutes, with opt-in capture, clearing and sharing controls. The [readiness report](docs/indoor-navigation-beta-readiness.md) records verified checks and the device walkthrough. Hosted CI, installable builds and device checks remain open.

Workspace-wide typecheck hit a pnpm nested-install/no-TTY failure during this assessment; filtered mobile typecheck passed. Native Android interaction evidence is recorded in `apps/mobile/BUILD_CHECKS.md` through 6 November; physical iOS/Android positioning remains unverified. A real map is needed for site-specific field accuracy, not for this implementation sequence.

## Current fund application (2026-10-28)

- [x] Revised the proposal for R100,000 over twelve months; removed the earlier pilot-budget and expansion-funding ask from the 14-page PDF.
- [x] Added two built-in ImageGen mobile plates covering map/search and route/guidance; generated images and exact prompts are saved under `docs/commercial-poc/mockups/imagegen/`.
- [x] Added two full-page dashboard concepts with visibly illustrative analytics and advertising figures; editable HTML and PNG sources are in `docs/commercial-poc/mockups/`. Independent design review passed; no different-provider evaluator was available.
- [x] Created `Atlas-12-Month-Fund-Plan.xlsx`: R86k direct spending, R14k unspent contingency, founder effort in kind, editable receipt/award assumptions; allocation, saved-file recalculation and delayed/no-award boundaries verified.
- [x] Rendered and visually reviewed all fourteen PDF pages and the fund workbook views. No live data, device or deployed-product outcomes are inferred from these mockups.

## Earlier exploratory commercial forecast (2026-10-28)

- [x] Business proposal covering consumer navigation, venue spatial intelligence, sponsored search and route-preview advertising: `docs/commercial-poc/Atlas-Business-Proposal.md`; 16-page PDF in `output/pdf/Atlas-Commercial-Proposal.pdf`.
- [x] Editable ZAR monthly forecast for November 2026-October 2029: `docs/commercial-poc/Atlas-36-Month-Cashflow.xlsx`, with one selector for downside/base/upside, revenue/cost/cash schedules, VAT, collections, media inventory/budgets and funding requirements.
- [x] All three cases reconciled to independent calculations; exported workbook reopened and recalculated; input/zero/missing-data boundaries checked; six worksheet views and all PDF pages visually reviewed. Desktop Excel not executed.
- [x] Defined one-venue pilot scope, proposed acceptance thresholds, approximately R800k initial funding gate and staged expansion decision. Assumptions remain commercially unvalidated; base full-horizon funding target R8.3m, with no three-month positive recurring earnings run inside the horizon.
- [ ] Secure venue scope, floorplan rights, reference counts, retailer feedback and actual supplier quotes; implement and field-test analytics and advertising before claiming live outcomes.

---

## 0. Engineering foundation (Phase 0 — `techspec.md` §17)

- [x] Monorepo layout created (`apps/`, `services/`, `packages/`, `tooling/`, `infrastructure/`, `docs/`, `tests/`)
- [x] Root `package.json` + `pnpm-workspace.yaml` + `tsconfig.base.json`
- [x] `.gitignore` (secrets, build output, production data excluded)
- [x] `README.md` with setup instructions and repo rules
- [x] ADR 0001 — initial technology choices
- [x] ADR 0002 — reference project survey
- [x] Dependencies installed and workspace scripts running under pnpm
- [~] CI pipeline (lint, typecheck, unit tests, build) — workflow added and validated locally with actionlint. Hosted execution is pending.
- [~] Secret-scanning check in CI — Gitleaks scanned 16 local commits and found no leaks. Hosted execution is pending.
- [x] Gradle wrapper generated for `platform-api` and `analytics-worker`
- [x] Local PostGIS verified end-to-end on isolated port 55432
- [x] Local database/admin-key configuration documented in `services/platform-api/README.md` and `.env.example`

---

## 1. Consumer mobile application (`apps/mobile`, `techspec.md` §5)

- [x] Native-only Expo/React Native/TypeScript app (iOS and Android; browser target removed)
- [x] Native safe areas and full-device layout
- [x] Native interactive map with illustrative corridor overlays, floor selection, selectable destinations and recenter
- [x] Consistent blue/light and navy/dark design system, SVG icons and bottom tabs
- [x] Search with typed queries, shared category filters and useful empty states
- [x] Destination preview, locally calculated per-destination demo routes and explicit navigation/arrival states
- [x] Step-free preference selects lift transitions in the historical two-floor fixture; the current single-reference-level schematic has 284 route/preference checks. Physical accessibility is unverified.
- [x] Appearance and reduced-motion preferences, including operating-system motion setting
- [x] Device-local saved places and five recent destinations, saved search scope and history clearing
- [x] Explicit floor/overview/follow/manual camera modes; panning pauses framing and Resume restores it
- [x] Next-instruction preview, completed/current route steps and primary actions pinned outside scrolling details
- [x] Interruptible sheet/instruction/button/progress motion, OS-enforced reduced motion and optional event haptics
- [x] Primary-source Google Maps/Waze/Apple Maps/Mapbox UX research, documented rationale and text-token contrast
- [x] Place-memory recovery/pruning/ordering and camera-mode checks alongside 18 routing cases
- [x] iOS Release simulator compilation verified through EAS (2026-10-12; final UX build f6359dda-0630-4c7f-9c17-ba9fc1ff83b8)
- [~] Xcross verification: installed 2.0.2 was tried with generated iOS files; Flutter builder fails at missing pubspec.yaml. Working React Native command/wrapper remains unresolved.
- [~] Native visual QA: newer SDK 58 Android Expo Go emulator interaction checks are recorded through 2026-11-06 in `apps/mobile/BUILD_CHECKS.md`. Physical-device sensor/navigation QA and current native iOS appearance remain unverified.
- [ ] Live positioning, backend route integration, spoken guidance, persistent preferences and downloadable map packages

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
- [x] Deterministic step peak detector and step-count replay checks on synthetic traces
- [x] BLE strategies: `nearestBeaconStrategy`, `weightedCentroidStrategy`, `trilaterationStrategy` (`src/ble.ts`)
- [x] Fingerprint k-NN matcher (`src/fingerprint.ts`)
- [x] Visual-positioning contract (`VisualPositioningProvider`, `src/visual.ts`) — contract only, no CV inference
- [~] Step detection — amplitude and interval rules implemented, physical-device tuning pending
- [ ] Step-length estimation (cadence/variance/calibration-walk based)
- [ ] Heading estimation (fused orientation baseline, gyro short-term rotation, magnetometer disturbance detection)
- [ ] PDR (pedestrian dead reckoning) state integration
- [ ] Floor detection (barometer/beacon/visual/user-confirmation fusion, multi-signal agreement rule)
- [~] Map matching: same-floor projection, direction, continuity and ambiguity tested in replay. Live integration and transition evaluation remain open.
- [ ] Confidence model (decay + recovery rules, tunable thresholds)
- [ ] Sensor/BLE abstraction interfaces for on-device sampling
- [x] Deterministic replay harness with baseline/candidate comparison (see `tooling/calibration-console`)
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
- [x] Replay file loader, schema validation and baseline/candidate reports

---

## 10. Testing (`techspec.md` §14)

- [ ] Unit tests: step detection, heading normalisation, coordinate transforms, graph/A* correctness, constraint handling, map-matching scoring, confidence decay/recovery, event-schema validation, campaign eligibility/impression dedup
- [x] Replay tests for 13 synthetic scenarios on two seeds, documented in `tests/positioning-replays`
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
- **Phase 2 — Positioning research harness:** observation types, recorder core, replay runner and a synthetic step/heading estimate are implemented. Device capture, field evaluation, map matching and OpenHPS comparison remain open.
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

- **2026-11-12 (map-free development planning):** Added `docs/indoor-navigation-roadmap.md` with P0–P6 execution stages, dependency order, completion gates, a software/device evidence matrix and first iteration backlog. Identified consumer-package/renderer contract differences, duplicated routing policies, missing positioning/replay implementations and workspace pnpm verification failure. Reconciled stale mobile QA summary with the newer native build log. No application behaviour or deployment changed.

- **2026-10-12 (native-only mobile polish):** Removed the consumer browser target/frame and SVG web map fallback; added native safe areas, coherent light/dark tokens and line icons, shared search/category/directory rows, scroll-bounded destination and guidance panels, explicit arrival, and a native corridor map with selectable places. Fixed destination previews using Zara's route by calculating local schematic routes for each selected POI; step-free mode uses lifts and all 18 destination/preference cases pass. Removed fake voice, granted-permission, diagnostics and download controls. Hoisted pnpm dependencies fix Expo native prebuild/autolinking and iOS bundle resolution. Final EAS Release simulator build 1aaa674b passes, as do workspace types, Expo dependency checks and Hermes export. Xcross 2.0.2 was actually tried but its Flutter builder fails at missing pubspec.yaml; a working React Native wrapper/command remains needed. Android visual QA is unverified after Expo Go startup failures on both API 37 and fresh API 34, including a minimal startup probe. Details: apps/mobile/BUILD_CHECKS.md.

- **2026-08-11 (native map-provider pass):** Added `react-native-maps` as the iOS/Android renderer with a desaturated outdoor basemap used explicitly as temporary interaction context, synthetic fixture coordinate projection, camera fitting/recentering, position accuracy, and route/marker overlays. Web retains the structured SVG fallback. Workspace typecheck, Expo web export, and Android production bundling pass; device/emulator visual QA remains outstanding.

- **2026-08-11 (neutral maps-style iteration):** Removed the illustrative fake mall architecture from the mobile map. Atlas now presents an abstract indoor navigation network with primary and secondary structured corridors, sparse orientation context, conventional blue current-position and route styling, a coral destination, and route vertices shared with corridor centerlines. Compact route panels retain map context, and the wide web shell uses intentional neutral framing. Mobile typecheck, production web export, refreshed phone/tablet captures, and a three-round external design evaluation pass.

- **2026-08-11 (Atlas mobile redesign pass):** Redesigned and rebuilt the entire `apps/mobile` frontend matching the premium Juice Lab reference UI aesthetic. Features full-screen flat 2D vector map (`MapCanvas`) on a light warm-grey canvas; multi-color gradient route drawing (orange → coral → violet → blue) with thick dark casing; start position glowing halo, accuracy cone, destination pin, and escalator/lift transition badges. Added floating translucent top search bar with voice search simulation; floating map controls (recenter, floor selector pill, compass, venue/floor badge, confidence dot); floating 3-destination bottom navigation bar (Map, Explore, Settings); destination preview bottom sheet with "Start navigation" CTA; active turn-by-turn guidance panel with distance to turn, route progress bar, expandable step list, and cancel CTA; Explore screen with category chips, shop cards, and sponsored labels; Settings screen with route accessibility preferences (avoid stairs, prefer lifts), dark appearance mode toggle, voice guidance, reduced motion, permissions, and 32MB offline venue map. TypeScript typecheck green across workspace.

- **2026-08-11 (backend import pass):** Added schema-v1 transactional package ingestion to `platform-api`, including source-ID-to-UUID mapping, cross-reference checks, SHA-256 checksum idempotency, Flyway V2 uniqueness, persisted graph validation, publication blocking, and import/validation/publication audit entries. Corrected all JSONB entity bindings after real PostGIS exposed varchar writes. Added Testcontainers PostGIS coverage for rollback, duplicates, validation gates, audit events, publication/version switching, Zara search, OpenAPI presence, and two-floor routing. Added a repeatable PowerShell flow; verified both fresh import and idempotent rerun against local PostGIS.

- **2026-08-11 (map-importer pass):** Implemented the MapPackageV1 contract end to end: versioned schema in `packages/spatial-model/src/map-package.ts`; global `GeoJSON` namespace replaced with explicit `geojson` typed imports across spatial-model and fixture-generator; Zod runtime schema (`schema.ts`) + semantic validator (`validate.ts`) covering metadata, ID uniqueness, venue/floor/node/edge/POI references, bounds, transition groups, connectivity, and geometry plausibility, all with stable structured error codes; deterministic canonical JSON + SHA-256 checksum (`canonical.ts`); CLI with `validate`/`inspect`/`canonicalize` and correct exit codes. `tests/contract` is now a workspace package with generated on-disk fixtures (valid + 5 malformed variants) and a 32-check contract suite — all green, and the fixture-generator output validates with zero warnings. Types re-exported from `@atlas/map-importer` and `@atlas/spatial-model` roots for a future API client. Contract documented in `docs/mapping/map-package-contract.md`. Also fixed workspace package entry points (`main`/`types` → `dist`) and nested-`pnpm` scripts in map-importer/fixture-generator/contract-tests.
- **2026-08-11:** Backend build-out pass on `services/platform-api`: Flyway `V1__initial_schema.sql` (venues, map versions, floors, POIs/categories, navigation nodes/edges, beacons, events_raw, audit_log); JPA entities + repositories; standard error contract; Kotlin A* `RouteService` with closure/restriction/one-way/validity filtering and floor segments/transitions (unit-tested); `SearchService` with §11 ranking; idempotent `EventIngestionService` with quarantine path (unit-tested); `MapPackageService`; public controllers (venues, floors, search, routes, map-package, positioning-config, events); admin controllers (venues, map publish/rollback, floors, graph bulk import + connectivity validation, closures, POIs, beacons) with role-gated `@PreAuthorize` and interim API-key auth; springdoc OpenAPI wired. Gradle wrappers generated for both services; `compileKotlin`/`test` green. Also created `agentconvo.md` for inter-agent coordination.
- **2026-08-07:** Redesigned the fixture-driven mobile prototype around a dark, map-first indoor cartography system. Expanded the schematic venue to a coherent atrium/concourse plan with 14+ tenant footprints, facilities, transition cores, doorway-specific Zara endpoint, map grid, chartreuse route, cyan position treatment, floating controls, phone-width web canvas, and mature light-theme counterpart. Follow-up browser QA corrected flex-growing buttons, route-preview clipping, search result columns, map-backed search, action contrast, overlay collisions, web landmarks, and centered graphite tablet/desktop framing. The existing search, navigation, correction, offline, and supporting-state functionality remains deterministic and local.
- **2026-08-06:** Replaced the mobile placeholder with a deterministic Sandton City consumer prototype: native two-floor schematic map, neutral and sponsored Zara search results, destination and route preview, active guidance, floor transition, confidence correction/reroute, arrival, and supporting offline/alert/report/privacy/camera/light/dark states. This is fixture-driven UI only; it does not claim live positioning, camera recognition, backend routing, or production GIS rendering. Dependency installation remains incomplete because the package mirror is missing `xtend` metadata.
- **2026-08-04:** Initial scaffold pass — monorepo structure, app/service shells, spatial/routing/positioning package contracts + BLE/fingerprint algorithms, analytics-worker job skeleton, ADRs 0001–0002. `pnpm install` blocked by environment permissions issue.
