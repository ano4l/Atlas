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

Springdoc publishes the current OpenAPI contract at `/v1/api-docs` and `/swagger-ui.html`.

## Verification

```powershell
Push-Location services/platform-api
.\gradlew.bat test
Pop-Location
```

The PostGIS integration test uses Testcontainers and requires Docker Desktop. To exercise the same flow manually, run `tests/end-to-end/run-map-package-flow.ps1` from the repository root.
