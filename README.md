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

- Node.js 20+ and [pnpm](https://pnpm.io/) 9+
- JDK 21+ and Gradle (wrapper included per service)
- Docker (for local PostgreSQL/PostGIS)
- Expo CLI (`npx expo`, installed on demand) and Xcode/Android Studio for device builds

## Local setup

```bash
# 1. Install JS/TS workspace dependencies
pnpm install

# 2. Start local PostGIS + supporting services
docker compose -f infrastructure/local/docker-compose.yml up -d

# 3. Run database migrations
pnpm --filter platform-api migrate   # placeholder until Flyway/Liquibase wiring lands

# 4. Start the platform API
cd services/platform-api && ./gradlew bootRun

# 5. Start the venue dashboard
pnpm --filter venue-dashboard dev

# 6. Start the mobile app
pnpm --filter mobile start
```

## Progress tracking

See [`progress.md`](./progress.md) for the full per-feature/per-engine checklist, kept up to date after every implementation pass.

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
