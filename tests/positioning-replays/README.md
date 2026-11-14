# Positioning replay fixtures

The calibration console compares the last confirmed fix with an experimental step and heading estimator. The generated suite contains 18 scenarios, including corridor drift, late samples, radio outliers, conflicting floor evidence and manual correction.

```powershell
corepack pnpm --filter @atlas/calibration-console test
node tooling/calibration-console/replay.cjs --suite 101
node tooling/calibration-console/replay.cjs C:\path\to\session.json --estimates
node tooling/calibration-console/replay.cjs C:\path\to\session.json --counted-steps 30
```

Use `--counted-steps` when someone independently counted the steps during a recorded walk. The report includes the signed step-count error, and the original export stays intact.

### Pair checkpoint marks with measurements

Record numbered checkpoints using **Mark checkpoint** during the walk. The replay export contains their elapsed times and remains unlabelled. Create a separate JSON file with coordinates you measured independently, using the same local coordinate system and floor IDs as the replay observations.

```json
[
  { "number": 1, "floorId": "ground", "x": 0, "y": 0 },
  { "number": 2, "floorId": "ground", "x": 5, "y": 0 }
]
```

```powershell
node tooling/calibration-console/replay.cjs C:\path\to\session.json --checkpoints C:\path\to\measurements.json --estimates
```

The tool pairs the measurements with the recorded times in memory. It does not write to either input file. Measured points serve as reference data for scoring. They do not supply positioning fixes, so a walk recorded without a known start can still report unavailable position estimates.

### Measure drift on a known walk

For a straight or turning walk, measure the starting point and record the directions of each leg independently. In a separate setup JSON file, use elapsed milliseconds from the start of the recording and degrees clockwise from local north.

```json
{
  "start": { "elapsedMs": 0, "floorId": "ground", "x": 0, "y": 0, "accuracyM": 0.3 },
  "headings": [
    { "fromMs": 0, "untilMs": 3500, "degrees": 90, "accuracyDegrees": 10 },
    { "fromMs": 3500, "untilMs": 7000, "degrees": 180, "accuracyDegrees": 10 }
  ]
}
```

```powershell
node tooling/calibration-console/replay.cjs C:\path\to\session.json --walk-setup C:\path\to\setup.json --checkpoints C:\path\to\measurements.json
```

The supplied start and direction are estimator inputs. Use later checkpoints held out of that setup for evaluation. The report identifies the tester-provided inputs. Leave gaps in the heading schedule when direction is unknown. The estimator stops advancing on steps without a reliable heading. This test measures drift with a known direction. Device heading estimation needs its own test.

### Replay turn-by-turn progress

Pass `--guidance route.json` to run the same route-progress engine used in the app against the candidate replay estimates. The route file uses the replay's venue ID and map version ID, including `null` for an unmapped walk.

```json
{
  "venueId": "unmapped-walk",
  "mapVersionId": null,
  "floors": [{ "floorId": "ground", "polyline": [[0, 0], [5, 0], [5, 4]] }],
  "confirmations": []
}
```

Coordinates use local metres. For a multi-floor route, add the floor polylines in travel order and supply explicit confirmations with `elapsedMs` and `floorId`. Confirmations run before any estimate with the same timestamp and are accepted only once guidance is prompting for that floor. The report records turn prompts, guidance state changes, accepted and rejected confirmations, remaining distance and arrival time. It follows the supplied route throughout the replay so a missed turn appears as an off-route state.

Guidance advances only when a newer motion sample or fix is available. If its capture time is more than 1.5 seconds behind the replay clock, guidance treats the estimate as unavailable and increments `staleSamples`. Repeated estimates from the same observation cannot satisfy arrival or off-route dwell time.

After the initial fix, accepted manual fixes appear in `corrections`. The report records capture and receipt times, the floor and the preceding guidance state. `recoveredAfterMs` measures elapsed time from receipt until fresh guidance resumes on that floor after uncertainty or an off-route state. A null value means the replay did not show recovery for that correction. The metric applies to the supplied route and does not time network rerouting.

Replay v1 carries `schemaVersion`, `fixtureId`, `venueId`, nullable `mapVersionId`, UTC `startedAt`, `durationMs`, integer `seed`, `device`, `truth` and `observations`. Device metadata records the platform and carrying state. Observation timestamps are elapsed milliseconds since session start. Store observations in receipt order and retain both capture time and receipt time. The runner rejects future or out-of-order observations from the same stream and reports how many it dropped.

The mobile recorder uses `device.timestampBasis: "receipt"` because the native sensor clock is not synchronized with the JavaScript clock. It preserves the original timestamp in seconds as `sensorTimestampSeconds` when supplied.

A fixture can include `corridors` with an ID, floor ID, endpoint node IDs and a polyline of points in local metres. These fixtures also report the walking estimate without matching so the effect of corridor projection can be measured independently. The candidate report includes the raw estimate and the corridor matching decision. Nearby disconnected or ambiguous corridors may leave the estimate unchanged. Matching preserves the estimator's confidence and accuracy values.

- Motion uses device-frame acceleration in m/s², including gravity.
- DeviceMotion recordings may include `verticalAccelerationMps2`. It projects linear acceleration onto the upward axis derived from the gravity vector. The adapter requires the paired timestamps to be within 80 ms and the derived gravity magnitude to be between 7 and 13 m/s². Older exports can omit this field.
- Heading uses degrees clockwise from map north. Local X increases east and local Y increases south.
- BLE uses RSSI in dBm and pressure uses hectopascals. The v1 estimator consumes motion, heading and manual fixes.
- Fixes and ground truth use local metres and explicit floor IDs. Label truth as `measured`, `simulated` or `unlabelled`. Unlabelled recordings have no checkpoints or expected step count.

Optional `radio` configuration supplies calibrated beacons and legal floor transitions. Three recent known beacons from a dominant floor are required for a correction. The estimator bounds same-floor adjustments and rejects large jumps. Repeated evidence near a legal transition can produce a `floorCandidateId`. An explicit fix is required to change the estimated floor.

The report includes step counts, wrong-floor and unavailable checkpoints, and median and 95th percentile distance error for usable estimates on the correct floor. It reports time lost at replay sample resolution. Keep real sensor exports outside Git. Generated results describe the simulated scenarios.

## OpenHPS step-count experiment

```powershell
corepack pnpm --filter @atlas/calibration-console compare:openhps --suite 42
corepack pnpm --filter @atlas/calibration-console compare:openhps --suite 101
corepack pnpm --filter @atlas/calibration-console compare:openhps C:\path\to\session.json --counted-steps 30
```

The experiment pins Apache-2.0 packages `@openhps/core@1.0.16` and `@openhps/imu@0.2.2` as calibration-tool development dependencies. The original comparison feeds OpenHPS the same gravity-adjusted acceleration magnitude used by Atlas, represented as a synthetic vertical axis. When every accepted motion sample carries vertical acceleration, the report also gives a separate OpenHPS step count for that signal. Partial coverage appears as a sample count with no vertical result. The adapter drops late motion samples and splits the series at gaps. OpenHPS runs its batch pedometer with default options and the median sample rate. Native capture and heading or position accuracy need separate experiments. [OpenHPS IMU documentation](https://openhps.org/docs/imu/) · [Pedometer implementation](https://github.com/OpenHPS/openhps-imu/blob/master/src/nodes/processing/PedometerProcessingNode.ts)

Both seeds produced the same counts. Atlas matched the generated labels in all 12 runs. OpenHPS matched the rotation cases and undercounted the ten walking cases.

| Scenario | Generated steps | Atlas | OpenHPS |
| --- | ---: | ---: | ---: |
| Straight | 9 | 9 | 8 |
| Corner | 9 | 9 | 8 |
| Stop and resume | 6 | 6 | 5 |
| Rotate in place | 0 | 0 | 0 |
| Pocket | 9 | 9 | 8 |
| Late packets | 9 | 9 | 7 |

OpenHPS batch medians were about 0.24–0.96 ms across the initial cases after one warm-up and five repeats on Windows, Node 22.13.0, Ryzen 5 5600H. Each case had 200–201 usable samples. The measurement includes conversion into OpenHPS types and excludes file loading and model startup. It gives no device CPU, battery, or latency estimate.

Keep the Atlas estimator in the app while collecting independently counted phone walks. The upstream React Native adapter declares native BLE, geolocation, Wi-Fi, sensor, and device-info dependencies. Native Expo compatibility remains unverified. The upstream IMU project also tracks a step-count discrepancy on its own data for this Core version. [OpenHPS React Native adapter](https://github.com/OpenHPS/openhps-react-native) · [Upstream step-count issue](https://github.com/OpenHPS/openhps-imu/issues/1)
