# Agent Conversation Log

Shared coordination channel for AI agents working in this repository. Purpose: let one agent see what another is doing, claim work without colliding, and hand off context so the next pass can be significant and uninterrupted.

## Protocol

1. **Check this file first.** Before starting a pass, read "Active claims" and the latest log entries. Do not start work that overlaps an active claim.
2. **Claim before you build.** Add an entry under "Active claims" with your agent name, the area you're touching, and the files you expect to modify. One claim per pass; keep it scoped.
3. **Work uninterrupted.** While your claim is active, other agents must not edit those files. If you need a file that's claimed, pick different work or leave a note in "Messages" instead of editing.
4. **Log as you go.** Append short entries to "Work log" at natural checkpoints (not every file edit — meaningful milestones only).
5. **Release and hand off.** When done, remove your claim, add a "Handoff" entry summarizing what changed, what's unfinished, and what you'd suggest next. Update `progress.md` checkboxes for anything completed.
6. **Commit before releasing a claim** so the next agent starts from a clean tree.

## Conventions

- Timestamps in UTC+02:00, ISO date (`2026-08-11`).
- Agent names: pick a short stable handle (e.g. `cascade`, `agent-b`) and use it consistently.
- Keep entries terse. Design rationale goes in `docs/architecture-decisions/`, status tracking in `progress.md` — this file is for coordination, not documentation.

---

## Active claims

| Agent | Area / files | Started | Note |
|---|---|---|---|
| — | cascade claim released 2026-08-11 | — | — |

## Messages

- **2026-08-11 cascade → any:** Backend pass is in flight. If you pick up work, good non-overlapping candidates: `tooling/fixture-generator` (synthetic two-floor venue — blocks the first milestone), `packages/map-rendering` internals, `tooling/map-importer` real validation, or `infrastructure/` CI pipeline. Avoid `services/platform-api/**` and `services/analytics-worker/**`.

## Work log

- **2026-08-11 codex:** Claimed the platform import vertical slice: transactional source-ID mapping, checksum idempotency, publication gates, PostGIS integration coverage, and reproducible local flow.

- **2026-08-11 codex:** Claimed the non-overlapping synthetic venue fixture generator after detecting cascade's live backend build. Target is a deterministic JSON package aligned with the platform admin import DTOs and routing invariants.

- **2026-08-04 cascade:** Initial scaffold pass complete. Monorepo structure, app/service shells, spatial/routing/positioning packages (BLE trilateration, fingerprint k-NN, visual contract), analytics-worker job skeleton, ADRs 0001–0002, `progress.md` created. Pushed to `origin/main`. Known blocker: `pnpm install` fails (nvm permissions) — TS packages can't typecheck until resolved.
- **2026-08-11 cascade:** Started backend build-out (claim above). Done so far: Flyway `V1__initial_schema.sql` (venues, map_versions, floors, POIs, nodes, edges, beacons, events_raw, audit_log); JPA entities + Spring Data repos; standard error contract + `@RestControllerAdvice`; `RouteService` (Kotlin A* with closure/restriction/one-way/validity filtering, floor segmentation, transitions); `SearchService` (ranking per techspec §11); `EventIngestionService` (idempotent via `eventId`, quarantine for bad schema/unknown venue/future timestamps); `MapPackageService` (single-version consistent package); public controllers (venues, floors, search, routes, map-package, positioning-config, events batch); admin venue controller (create venue, create/publish/rollback map version, audit logging). springdoc + flyway deps added to build.gradle.kts.

## Handoffs

- **2026-08-11 codex (released):** Transactional PostGIS import slice complete in `cb1d161`. `POST /v1/admin/map-packages/import` accepts schema-v1 packages, validates source IDs/references/costs/transitions, maps source IDs to DB UUIDs, persists the next draft atomically, computes/stores a canonical SHA-256 idempotency key, and rolls back invalid persisted graphs. Publication now gates floors, graph connectivity, POI entrances, costs, transitions, and map-version ownership; import/validation/publication are audited. Flyway V2 adds checksum uniqueness. Real PostGIS uncovered and fixed all JSONB JDBC bindings. Testcontainers 1.21.4 covers Flyway/JPA, rollback, duplicate import, blocked publication, audit events, OpenAPI, Zara search, two-floor routing, and version switching; full `gradlew test` is green. `tests/end-to-end/run-map-package-flow.ps1` passed fresh and idempotent reruns on ports 55432/18080. Local Atlas PostGIS container is stopped with its named volume retained. Next: wire the venue dashboard and mobile API client to this flow.

- **2026-08-11 cascade (released):** MapPackageV1 validation tooling complete. `packages/spatial-model` now exports `MapPackageV1`/`MapPackageChecksum`/`MAP_PACKAGE_SCHEMA_VERSION` and uses explicit `geojson` typed imports (global namespace gone, also cleaned in fixture-generator). `tooling/map-importer` does Zod structural validation + ~25 semantic rules (refs, bounds, transition groups, connectivity, geometry) with stable error codes, canonical JSON + SHA-256 checksum, and a `validate`/`inspect`/`canonicalize` CLI with proper exit codes. `tests/contract` is a workspace package: generated fixtures (valid + 5 malformed) and a 32-check suite, all green; fixture-generator output validates with zero warnings. Contract doc: `docs/mapping/map-package-contract.md`. **Build-config changes outside my claim (noting for visibility):** fixture-generator `package.json` now points `main`/`types` at `dist/` and its scripts avoid nested `pnpm` (was failing without a global pnpm shim); `pnpm-workspace.yaml` now includes `tests/contract`. **For codex (platform-api import slice):** the checksum (`checksumPackage`, sha256 over canonical JSON) is the natural idempotency key for transactional import; `validateMapPackage()` gives you the full structured report if you want to gate backend import on it.

- **2026-08-11 codex (released):** Implemented `tooling/fixture-generator` as a deterministic schema-v1 two-floor venue package with stable IDs, local-metre geometry, routable Zara and information POIs, lift/escalator alternatives, admin-import DTO payload, CLI JSON output, and invariant tests. `pnpm --filter @atlas/fixture-generator typecheck` and `test` pass; CLI smoke output contained 2 floors, 10 nodes, 10 edges, and 2 POIs. Next: make `tooling/map-importer` validate this package and/or add a backend bulk-package import orchestrator.

- **2026-08-11 cascade (released):** Backend pass complete. `services/platform-api` now has: Flyway V1 schema, JPA entities/repos, error contract, Kotlin A* `RouteService` (unit-tested), `SearchService`, idempotent `EventIngestionService` (unit-tested), `MapPackageService`, all public consumer controllers, admin controllers (venues/maps/floors/graph/closures/POIs/beacons), interim API-key security with role-gated `@PreAuthorize`, springdoc OpenAPI at `/v1/api-docs`. Gradle wrappers generated for both services; `compileKotlin` + `test` green on platform-api, `compileKotlin` green on analytics-worker. A Gradle 8.8 distribution is cached at `%TEMP%\gradle-8.8\gradle-8.8\bin\gradle.bat` for any agent that needs it. **Next suggested pass for another agent:** synthetic venue fixture generator (`tooling/fixture-generator`) producing a JSON package importable via the new admin bulk-import endpoints — unblocks the §21 first milestone. Note: another agent did mobile prototype work on 2026-08-06/07 — check `git log` and `apps/mobile` before touching the app.

## Open questions for any agent

- Identity provider + role-management approach (techspec.md §20) — interim API-key auth is in place (`SecurityConfig.kt`); confirm direction before replacing it.
- ~~Gradle wrapper generation~~ — done 2026-08-11 for both services; Gradle 8.8 cached at `%TEMP%\gradle-8.8\gradle-8.8\bin\gradle.bat`.
