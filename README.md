# Indoor Spatial Navigation Platform

Consumer indoor-navigation platform: venue detection, indoor map search, multi-floor routing, live position tracking with confidence, and a venue/advertising operator dashboard.

> Status: **Phase 0 — Engineering foundation**. See `techspec.md` for the full technical specification. This README tracks the buildable scaffold only; the spec is the source of truth for product/architecture decisions.

## System overview

Four product systems, one monorepo for now (see `techspec.md` §2, §4):

| System | Path | Description |
|---|---|---|
| Consumer mobile application | `apps/mobile` | React Native + Expo + TypeScript. Search, map, routing, live navigation. |
| Venue & advertising dashboard | `apps/venue-dashboard` | Next.js + TypeScript. Map management, campaigns, analytics. |
| Platform API | `services/platform-api` | Spring Boot (Kotlin). Venues, maps, search, routing, events, admin. |
| Analytics worker | `services/analytics-worker` | Spring Boot (Kotlin). Event validation and aggregation jobs. |

Shared logic lives under `packages/`, internal tools under `tooling/`, infra config under `infrastructure/`, decisions/specs under `docs/`, and cross-cutting tests under `tests/`.

## Monorepo layout

```text
indoor-navigation-platform/
├── apps/
│   ├── mobile/                    # React Native consumer application
│   └── venue-dashboard/           # Next.js operator and advertising UI
├── services/
│   ├── platform-api/              # Spring Boot public/internal API
│   └── analytics-worker/          # Event validation and aggregation jobs
├── packages/
│   ├── positioning-core/          # Pure positioning algorithms and models
│   ├── spatial-model/             # Shared venue/map schemas
│   ├── routing-core/              # Graph construction and route rules
│   ├── map-rendering/             # Shared map styling and render helpers
│   ├── analytics-events/          # Event names, schemas, validation
│   ├── api-client/                # Generated TypeScript API client
│   └── shared-types/              # Cross-application types and constants
├── tooling/
│   ├── map-importer/              # GIS/map package validation and import
│   ├── calibration-console/       # Field-log inspection and tuning tools
│   └── fixture-generator/         # Synthetic venues and movement sessions
├── infrastructure/
│   ├── local/                     # Local database and service configuration
│   ├── environments/              # Development, staging, pilot
│   └── migrations/                # Database migration ownership
├── docs/
│   ├── architecture-decisions/    # ADRs
│   ├── api/                       # API and event documentation
│   ├── mapping/                   # Map production standards
│   └── field-testing/             # Test plans and calibration reports
└── tests/
    ├── end-to-end/
    ├── contract/
    ├── positioning-replays/
    └── performance/
```

## Repository rules

- The monorepo is the source of truth for code and technical documentation.
- No application imports another application directly.
- Shared packages must expose documented public APIs.
- `apps/mobile` may depend on `packages/positioning-core`, but `positioning-core` must not depend on React Native UI code.
- Spatial schemas are versioned and backward-compatible within a released pilot map package.
- Every database change uses a migration (`infrastructure/migrations`).
- Secrets, production datasets, architectural drawings, and raw movement exports must not be committed.

## Prerequisites

- Node.js 22.13.0 with Corepack. The root `packageManager` pins pnpm 9.0.0.
- JDK 21. Each Kotlin service includes a Gradle wrapper.
- Docker (for local PostgreSQL/PostGIS)
- Xcode or Android Studio for native builds. The mobile workspace includes Expo CLI.

## Local setup

```bash
# 1. Install JS/TS workspace dependencies
corepack pnpm install --frozen-lockfile

# 2. Start local PostGIS + supporting services
docker compose -f infrastructure/local/docker-compose.yml up -d

# 3. Start the platform API in a separate terminal. Flyway runs on startup.
(cd services/platform-api && ./gradlew bootRun)

# 4. Start either app from the repository root in its own terminal
corepack pnpm --filter venue-dashboard dev
corepack pnpm --filter mobile start
```

On Windows, run `./gradlew.bat bootRun` from `services/platform-api`. Follow the [fictional venue setup](./apps/mobile/README.md#preview-a-connected-test-venue) to seed and publish a map for connected mobile navigation.

## Workspace checks

```bash
corepack pnpm lint
corepack pnpm build
corepack pnpm typecheck
corepack pnpm test
(cd services/platform-api && ./gradlew check bootJar)
```

The platform API suite uses Docker for its PostGIS integration test. The workspace test command exercises fixture generation, map contracts, mobile navigation logic and deterministic positioning replay. The package-level test entries for `analytics-events`, `routing-core` and `positioning-core` are placeholders. Routing and positioning have coverage through the mobile and replay suites. Dashboard lint currently covers the dashboard. Native runtime and bundle checks are tracked in [mobile build checks](./apps/mobile/BUILD_CHECKS.md).

## Progress tracking

See [`progress.md`](./progress.md) for the full per-feature/per-engine checklist, kept up to date after every implementation pass.

The active development sequence is the [indoor navigation roadmap](./docs/indoor-navigation-roadmap.md): phased work through a synthetic-venue beta, including connected/offline routing, sensor recording, replay, positioning and recovery, without requiring a real venue map. It defines completion gates, the first iteration backlog and the later field-validation boundary.

## Phase 0 exit criteria (from `techspec.md` §17)

- [ ] All applications build from a clean checkout.
- [ ] A developer can start the complete local environment from documented steps above.
- [ ] CI blocks broken contracts and tests.

## Documentation

- Full technical specification: [`techspec.md`](./techspec.md)
- Architecture decision records: [`docs/architecture-decisions`](./docs/architecture-decisions)
- API & event contracts: [`docs/api`](./docs/api)
- Map production standards: [`docs/mapping`](./docs/mapping)
- Field-testing plans: [`docs/field-testing`](./docs/field-testing)

## Reference projects

Positioning and analytics-pipeline patterns adapted from public reference projects are documented in [`docs/architecture-decisions/0002-reference-project-survey.md`](./docs/architecture-decisions/0002-reference-project-survey.md), including BLE trilateration (`packages/positioning-core/src/ble.ts`), fingerprint matching (`packages/positioning-core/src/fingerprint.ts`), and the visual-positioning contract (`packages/positioning-core/src/visual.ts`).

## First development milestone

> On a physical iOS or Android device, open a synthetic two-floor venue, search for a destination, select a starting point, and display a correct multi-floor route generated by the backend from a versioned map managed through the dashboard.

This validates the monorepo, spatial schema, rendering, search, routing, API, database, dashboard, and deployment path before positioning work begins.
