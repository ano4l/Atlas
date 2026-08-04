// Loads field-test replay fixtures (techspec.md §14.2), runs them through
// @atlas/positioning-core, and reports accuracy deltas across algorithm
// versions. Implementation lands in Phase 2.

export interface ReplayFixture {
  fixtureId: string;
  mapVersionId: string;
  sensorSamplesPath: string;
  bleSamplesPath: string;
  groundTruthCheckpoints: Array<{ timestampMs: number; x: number; y: number; floorId: string }>;
}

export function loadFixture(_path: string): ReplayFixture {
  throw new Error("loadFixture not implemented (Phase 2)");
}
