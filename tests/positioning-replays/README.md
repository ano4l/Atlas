# Positioning replay fixtures

Deterministic replay fixtures for the positioning engine (`techspec.md` §14.2). Each fixture bundles timestamped sensor/BLE observations, optional ground-truth checkpoints, device/carrying-state metadata, and expected route/floor outcomes.

Algorithm changes in `packages/positioning-core` must run against this suite and report accuracy deltas before merging. Fixtures are generated via `tooling/fixture-generator` and inspected via `tooling/calibration-console`.
