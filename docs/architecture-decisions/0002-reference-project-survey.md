# ADR 0002: Reference project survey and adaptations

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Seven public projects were reviewed for techniques applicable to the Indoor Spatial Navigation Platform. None are adopted as dependencies — per the architecture decision rule (`techspec.md` §3.1), the platform retains ownership of the canonical venue model, routing, and confidence representation. Instead, specific algorithms and structural patterns were adapted into our own TypeScript/Kotlin code.

## Decision

| Reference | Relevant technique | Where adapted |
|---|---|---|
| [Navigine/Indoor-Positioning-And-Navigation-Algorithms](https://github.com/Navigine/Indoor-Positioning-And-Navigation-Algorithms) | Trilateration/multilateration over BLE ranges; `LevelCollector`/`NavigationClient` style level (floor) management | `packages/positioning-core/src/ble.ts` (`trilaterationStrategy`, `weightedCentroidStrategy`, `nearestBeaconStrategy`) |
| [dmsl/anyplace](https://github.com/dmsl/anyplace) | Modular Server/Architect/Viewer split; multi-floor blueprint placement in a map editor; draft/public map versioning with crowdsourced radiomaps | `apps/venue-dashboard` (Architect-equivalent map-management module, `techspec.md` §9.2), `docs/mapping/README.md` |
| [litanli/indoor-locationing](https://github.com/litanli/indoor-locationing) | k-NN (1-NN, Manhattan distance) fingerprint matching on the UJIIndoorLoc benchmark performed best among tested models | `packages/positioning-core/src/fingerprint.ts` (`matchFingerprint`) |
| [automaticdai/yfips-indoor-positioning-system](https://github.com/automaticdai/yfips-indoor-positioning-system) | Two vision-positioning modes: fiducial marker (AprilTag) and reference-image matching (ORB + homography) | `packages/positioning-core/src/visual.ts` (`VisualFixMethod`, `VisualPositioningProvider` contract; actual CV inference stays on-device per §4.1) |
| [zhangleino1/WIFI-SCI-Indoor-Positioning](https://github.com/zhangleino1/WIFI-SCI-Indoor-Positioning) | Deep-learning CSI-based regression positioning | Noted as a **future upgrade path** only (`packages/positioning-core/src/fingerprint.ts` header comment) — out of scope while consuming standard phone RSSI, not raw CSI |
| [hoangsonww/End-to-End-Data-Pipeline](https://github.com/hoangsonww/End-to-End-Data-Pipeline) | Scheduled batch/warehouse aggregation DAG pattern | `services/analytics-worker/src/main/kotlin/com/atlas/analytics/aggregation/AggregationJobs.kt` — reproduced as lightweight Spring `@Scheduled` jobs, **not** Kafka/Spark/Airflow |
| [hammad42/Cloud-Data-Processing-Pipelines](https://github.com/hammad42/Cloud-Data-Processing-Pipelines) | Medallion-style bronze/silver/gold aggregation staging | Same `AggregationJobs.kt`; informs the future hourly/daily rollup table design in `techspec.md` §8.6 |

## Consequences

- No new runtime infrastructure (Kafka, Spark, Airflow, Snowflake) was introduced. `techspec.md` §3 explicitly defers cache/queue infrastructure until measured load requires it; the data-pipeline references were used only for job-scheduling *shape*, not for their infrastructure stack.
- BLE and fingerprint positioning now have concrete starter implementations rather than only interfaces, but all thresholds (path-loss exponent, missing-signal penalty, k) remain configuration, not hard-coded assumptions, per `techspec.md` §6.4.
- Visual positioning remains a contract (`VisualPositioningProvider`) with no on-device CV implementation yet — actual AprilTag/ORB inference requires a native module decision, tracked as an open decision in `techspec.md` §20 ("visual-positioning approach").
- If a third-party SDK (e.g. Navigine's commercial SDK) is evaluated later, it must sit behind the same `BeaconPositioningStrategy`/`VisualPositioningProvider` interfaces so it stays replaceable.
