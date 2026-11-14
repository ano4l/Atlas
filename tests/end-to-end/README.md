# End-to-end backend flow

`run-map-package-flow.ps1` exercises the first real platform milestone:

1. Start local PostGIS.
2. Generate the deterministic two-floor venue package.
3. Start `platform-api`.
4. Import the package transactionally.
5. Publish the imported map version.
6. Fetch the published package and search for Zara in that version.
7. Request a two-floor route and verify that it ends at Zara's entrance.

Run from the repository root:

```powershell
.\tests\end-to-end\run-map-package-flow.ps1
```

Use `-KeepApiRunning` to leave the API process alive after the check. The script never removes the PostGIS volume.

If you already have an isolated local PostgreSQL database with PostGIS binaries available, set `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD` in the terminal and pass `-UseExistingDatabase`. Flyway initializes an empty database on startup. The script imports and publishes fictional venue data, so use a database dedicated to this test.

The API uses port 18080 by default. Pass `-ApiPort` to choose a free port if you already have an API running.

Pass `-CheckRouteParity` to compare backend and offline results for every mapped starting entrance, destination and route mode in the published fixture. The script runs once with the lift open and again with it closed, then restores the lift. Each run compares route availability, floor polylines, transition types, distance and time, and reports sample counts and p50/p95 latency. Use a dedicated fictional test venue with no concurrent map changes.

Pass `-CheckScenarios` to publish and compare six generated variants, verify closed-destination and updated-alias search behavior, and restore the baseline version afterward. Use the local development database. The imported variant versions remain in its map history.

Follow the [mobile preview instructions](../../apps/mobile/README.md#preview-a-connected-test-venue) to open the published venue in the app.

## Local evidence from 2026-11-13

Ran `-UseExistingDatabase -ApiPort 18082 -CheckRouteParity -CheckScenarios` on the Atlas working tree based on `7cb6de6`, with Windows, Node 22.13.0, PostgreSQL 16.16 and PostGIS 3.4.2. Atlas imported and published the fictional venue, found Zara through search and routed 80 m over two floors. All 1,194 API and offline comparisons agreed across ten conditions. Of these, 1,064 returned routes and 130 returned the expected no-route result. The closed Zara scenario checks search exclusion and compares routes to the remaining 19 destinations. The curved corridor scenario verifies the intermediate points and 35.8 m walking distance to the information desk. The scheduled route scenario verifies that the step-free route expires at the lift cutoff. The flow restores the published baseline and reopens its lift.

Each condition had 114–120 requests. Offline computation p95 ranged from 0.20 to 0.24 ms. Loopback HTTP p95 ranged from 9.08 to 22.49 ms. These timings describe the Windows test host and include no device measurements.

### Database recovery

For a disposable test instance, run `pg_dump --format=custom --file=atlas.backup <source-database>`, create an empty database on a server with the same PostGIS extension available, and run `pg_restore --exit-on-error --dbname=<restore-database> atlas.backup`. Set `DATABASE_URL` to the restored database and rerun the baseline flow with `-UseExistingDatabase`.

Verified a 68,259-byte custom dump restored into a new local database. The restored database retained the published version ID, six retired versions, the open lift and matching audit action counts. The API reused the existing package on import and returned the same 80 m, two-floor route to Zara.
