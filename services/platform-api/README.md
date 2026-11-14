# Platform API

Spring Boot/Kotlin service for versioned venue maps, search, routing, positioning configuration, events, and operator APIs.

## Run locally

From the repository root in PowerShell:

```powershell
docker compose -f infrastructure/local/docker-compose.yml up -d
$env:ADMIN_API_KEYS = "local-development-key:PLATFORM_ADMIN,MAPPING_OPERATOR"
Push-Location services/platform-api
.\gradlew.bat bootRun
Pop-Location
```

Flyway applies the schema automatically and Hibernate validates that its entity mappings match PostgreSQL/PostGIS.

## Transactional map-package import

`POST /v1/admin/map-packages/import` accepts a schema-v1 package with stable source IDs. It performs source-reference validation, creates or reuses the venue, creates the next draft map version, resolves source IDs to database UUIDs, writes floors/nodes/edges/POIs in one transaction, and validates the persisted graph. A SHA-256 checksum makes identical imports idempotent.

Admin requests require `X-API-Key`. Configure keys through `ADMIN_API_KEYS`:

```text
secret:PLATFORM_ADMIN,MAPPING_OPERATOR;another-secret:VENUE_ADMIN
```

Publishing through `POST /v1/admin/venues/{venueId}/map-versions/{mapVersionId}/publish` is rejected unless the persisted package has floors, a connected non-empty graph, positive edge costs, legal floor transitions, and routable POIs.

### Operate a fictional venue

Run these commands from the workspace root. Set `ATLAS_OPERATOR_KEY` in your terminal to a key with the mapping operator role. The CLI uses `http://localhost:18080` by default. Set `ATLAS_OPERATOR_API_URL` for a different instance.

```powershell
corepack pnpm --filter @atlas/map-importer operator import path/to/venue.json
corepack pnpm --filter @atlas/map-importer operator venues
corepack pnpm --filter @atlas/map-importer operator versions $venueId
corepack pnpm --filter @atlas/map-importer operator validate $venueId $versionId
corepack pnpm --filter @atlas/map-importer operator publish $venueId $versionId
corepack pnpm --filter @atlas/map-importer operator closure $edgeId closed "Maintenance"
corepack pnpm --filter @atlas/map-importer operator closure $edgeId open
corepack pnpm --filter @atlas/map-importer operator rollback $venueId $previousVersionId
```

Use the venue and version IDs from the import response or version list. Use the edge ID from the import response's edge mappings or from the published map package. Rollback restores a previously published version that still passes validation. Online consumers receive the changed package on their next sync. Offline clients use the closures saved with their copy.

Springdoc publishes the current OpenAPI contract at `/v1/api-docs` and `/swagger-ui.html`.

The API returns an `X-Request-Id` header. If a navigation error shows a reference, use it to find the matching API failure in the service logs. Missing or invalid incoming IDs are replaced with a generated ID. The failure summary records the HTTP method and status.

## Verification

```powershell
Push-Location services/platform-api
.\gradlew.bat test
Pop-Location
```

The PostGIS integration test uses Testcontainers and requires Docker Desktop. To exercise the same flow manually, run `tests/end-to-end/run-map-package-flow.ps1` from the repository root.
