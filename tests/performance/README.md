# Performance tests

Load and latency benchmarks for `services/platform-api` and `services/analytics-worker` (route computation duration, event ingestion throughput, map-package generation time — see observability targets in `techspec.md` §15).

## Indoor route latency

Use the [PostGIS route matrix](../end-to-end/README.md#local-evidence-from-2026-11-13) to measure offline computation and loopback API latency on the fictional two-floor fixture. The matrix exercises three entrances, 20 destinations and two routing modes. The closed-destination variant has 19 routable destinations.

For comparisons, use the same machine, fixture, database and runtime versions. Run three times and record the p50, p95 and sample count from each condition. Preserve the raw reports and note whether other processes were running during the measurement. Current numbers are a host baseline. Device frame pacing, memory, battery use and event throughput still need measurements.

### Benchmark the mobile offline planner

Download the published consumer package once from `/v1/venues/{venueId}/map-package`. Then run the benchmark from the repository root. It needs only the saved JSON and the workspace dependencies.

```powershell
node apps/mobile/scripts/benchmark-offline-routing.cjs .\published-map.json 30
```

The runner warms up all combinations once and measures p50 and p95 separately by routing mode. It also times parsing and validating the saved snapshot in memory. The output records the fixture SHA-256, host, graph size, snapshot size and sample counts. Set `ATLAS_BENCHMARK_AT` to a fixed ISO timestamp when comparing packages with validity windows.

On Windows with Node 22.13.0 and a Ryzen 5 5600H, the published baseline contained 46 nodes, 48 edges, two floors, three starts and 20 destinations. Its snapshot was 32,212 bytes. Three runs with 1,800 requests per mode per run yielded the following p95 ranges in milliseconds.

| Measurement | Before graph reuse | After graph reuse and indexing |
| --- | ---: | ---: |
| Shortest route | 0.0511–0.0594 | 0.0273–0.0328 |
| Step-free route | 0.0544–0.0570 | 0.0272–0.0331 |
| Snapshot decode and validation | 0.5922–0.6903 | 0.5589–0.6977 |

These are workstation measurements with a warm planner. The snapshot check excludes device storage latency. No regression budget has been set from these runs.
