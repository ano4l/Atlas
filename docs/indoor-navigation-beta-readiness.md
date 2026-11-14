# Atlas map-free beta readiness

Evidence reviewed on 2026-11-13. The working tree is based on `7cb6de6`. This report covers the fictional test venue and its software and replay checks.

| Area | Verified evidence | Remaining evidence |
| --- | --- | --- |
| Workspace and CI | Frozen workspace install, lint, type checks, workspace build and regression suites passed locally. Workflow syntax and the local history scan passed. | First GitHub-hosted run, including the Docker job and mobile bundle exports. |
| Spatial contract | Two-floor baseline with three mapped entrances and 20 destinations. Six deterministic variants validate. Disconnected, malformed and unsupported packages fail contract tests. | Consumer compatibility across supported installed app versions. |
| Operator and connected API | Import, publication, closure changes, alias search and rollback ran against PostgreSQL 16.16 and PostGIS 3.4.2. A backup restored into a new local database and served the same Zara route. | Synthetic staging configuration and a full connected journey in the current Android and iOS apps. |
| Online and offline routing | 1,194 matching outcomes across ten PostGIS conditions, including authored bends, scheduled route expiration and 130 expected no-route results. | Rerun on hosted CI. |
| Saved maps | The app's venue loader reopens from a disk-backed test cache with the API unavailable. Checks cover stale sync time, alias search, step-free routing, invalid and interrupted updates, rollback and corrupt or incompatible snapshots. | Force-stop and reopen with the API unavailable using native storage on Android and iOS. |
| Replay and positioning | 18 deterministic scenarios on two seeds, including floor ambiguity, radio outliers and correction. OpenHPS comparison ran on six synthetic cases with two seeds. | Independently counted phone walks, native sensor capture and BLE evidence. |
| Guidance and checkpoints | Software tests cover turn progress, arrival, floor confirmation, parallel corridors, backtracking, curved missed turns with offline recovery, and QR payload validation. | Camera permissions and physical scans, connected native interruption and recovery, and live sensor guidance. |
| Diagnostics | Backend request-reference tests and mobile report tests cover opt-in, report limits, stop, clear and expiry. | Verify Settings capture and the system share sheet on both platforms. |
| Native build and accessibility | Expo bundle export is repeatable locally and has a CI step. Historical Android emulator checks cover the schematic venue. | Current installable builds and native accessibility and runtime checks for each platform. |
| Performance | The PostGIS matrix measures loopback latency. The [offline benchmark](../tests/performance/README.md) measured warm-planner p95 of 0.027–0.034 ms per route on the baseline fixture. | Measure rendering, memory and battery on devices. Agree regression budgets after collecting baselines. |
| Surveyed venue accuracy | Pending site access and independently measured checkpoints. | Verify corridor and entrance placement, floor transitions, and accessible routes at the chosen venue. |

### Bundle export evidence

Ran two Expo exports per platform on Windows, with Node 22.13.0, Expo SDK 58 and the same connected-venue configuration. Both runs succeeded for each platform. Android output was 3,501,078 and 3,501,079 bytes. iOS output was 3,495,497 and 3,495,498 bytes. The filenames matched within each platform and the SHA-256 hashes differed. CI checks successful exports. Byte-for-byte reproducibility and native installation are still unverified.

## Reproduce the checks

- [Workspace setup and commands](../README.md)
- [PostGIS route matrix and backup recovery](../tests/end-to-end/README.md)
- [Replay and OpenHPS comparison](../tests/positioning-replays/README.md)
- [Mobile build and device evidence](../apps/mobile/BUILD_CHECKS.md)
- [Native walkthrough, checkpoints and diagnostics](../apps/mobile/README.md)
- [GitHub workflow](../.github/workflows/atlas-checks.yml)

## Native acceptance walkthrough

Run this on Android and iOS with the same published fictional package. Record the app build, device or emulator, OS version, map version and result for each check.

1. Open the fictional venue, search for Zara and preview the two-floor route. Repeat with step-free routing enabled and verify the lift instruction.
2. Confirm **Last synced** appears. Force-stop and reopen Atlas with the API unavailable. Open the venue, search and preview a route from the saved map.
3. Restore the API, publish a map variant and choose **Sync map**. Verify the expected change and repeat after restoring the baseline.
4. Start a simulation, exercise a missed turn, confirm a floor change and reach the destination. Background the app during guidance and verify that simulation pauses.
5. Try manual correction and scan a printed checkpoint from the current version. Try a code from another version and deny camera access on a fresh installation.
6. Start diagnostics, trigger an API failure, share the report and clear it. On a physical phone, capture and export an independently counted walk and replay it locally.
7. Repeat the core journey with the platform screen reader, large text and reduced motion. Record focus, announcements and any clipped controls.
