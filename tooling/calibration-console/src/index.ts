import { createCorridorMatcher, createRadioPositioning, createWalkingProvider, MAX_REPLAY_MARKS, type CorridorMatch } from "@atlas/positioning-core";
import type { PositionObservation, PositioningProvider, ReplayFixture } from "@atlas/positioning-core";
export type { ReplayFixture } from "@atlas/positioning-core";

const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const within = (value: unknown, min: number, max: number): value is number => finite(value) && value >= min && value <= max;

function validObservation(value: unknown, duration: number): value is PositionObservation {
  if (!object(value) || !within(value.timestampMs, 0, duration) || !within(value.receivedAtMs, 0, duration) ||
      (value.sensorTimestampSeconds !== undefined && !within(value.sensorTimestampSeconds, 0, Number.MAX_SAFE_INTEGER))) return false;
  switch (value.kind) {
    case "motion": return [value.accelerationX, value.accelerationY, value.accelerationZ].every(finite) &&
      (value.verticalAccelerationMps2 === undefined || finite(value.verticalAccelerationMps2));
    case "heading": return within(value.degrees, 0, 360) && value.degrees < 360 && within(value.accuracyDegrees, 0, 180);
    case "ble": return text(value.beaconId) && within(value.rssiDbm, -127, 0);
    case "pressure": return within(value.hectopascals, 100, 1500);
    case "fix": return text(value.floorId) && finite(value.x) && finite(value.y) && within(value.accuracyM, 0, 1000);
    default: return false;
  }
}

export function parseReplay(value: unknown): ReplayFixture {
  if (!object(value) || value.schemaVersion !== 1 || !text(value.fixtureId) || !text(value.venueId) ||
      !(value.mapVersionId === null || text(value.mapVersionId)) || !text(value.startedAt) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.startedAt) ||
      !Number.isFinite(Date.parse(value.startedAt)) || !Number.isSafeInteger(value.seed) ||
      !within(value.durationMs, 0, MAX_DURATION_MS)) throw new Error("Invalid replay metadata or schema version");
  const { device, durationMs, observations, truth } = value;
  if (!object(device) || !["ios", "android", "synthetic"].includes(String(device.platform)) ||
      !text(device.carrying) || (device.motionSource !== undefined &&
        device.motionSource !== "device-motion" && device.motionSource !== "accelerometer") ||
      (device.timestampBasis !== undefined &&
        device.timestampBasis !== "receipt" && device.timestampBasis !== "synchronized")) {
    throw new Error("Invalid replay device metadata");
  }
  if (!object(truth) || !["measured", "simulated", "unlabelled"].includes(String(truth.provenance)) ||
      !Array.isArray(truth.checkpoints) ||
      (truth.stepCount !== undefined && (!within(truth.stepCount, 0, Number.MAX_SAFE_INTEGER) || !Number.isInteger(truth.stepCount)))) {
    throw new Error("Invalid replay ground truth");
  }
  if (truth.provenance === "unlabelled" && (truth.checkpoints.length || truth.stepCount !== undefined)) {
    throw new Error("Unlabelled replays cannot contain ground truth");
  }
  let previousCheckpoint = -1;
  for (const [index, checkpoint] of truth.checkpoints.entries()) {
    if (!object(checkpoint) || !within(checkpoint.elapsedMs, 0, durationMs) ||
        checkpoint.elapsedMs <= previousCheckpoint || !text(checkpoint.floorId) ||
        !finite(checkpoint.x) || !finite(checkpoint.y)) throw new Error(`Invalid truth.checkpoints[${index}]`);
    previousCheckpoint = checkpoint.elapsedMs;
  }
  if (!Array.isArray(observations)) throw new Error("Missing observations array");
  if (value.marks !== undefined) {
    if (!Array.isArray(value.marks) || value.marks.length > MAX_REPLAY_MARKS) throw new Error("Invalid checkpoint marks");
    let previous = -1;
    for (const [index, mark] of value.marks.entries()) {
      if (!object(mark) || mark.number !== index + 1 || !within(mark.elapsedMs, 0, durationMs) || mark.elapsedMs <= previous) {
        throw new Error(`Invalid marks[${index}]`);
      }
      previous = mark.elapsedMs;
    }
  }
  if (value.radio !== undefined) {
    const radio = value.radio;
    if (!object(radio) || !Array.isArray(radio.beacons) || !Array.isArray(radio.transitions)) {
      throw new Error("Invalid radio configuration");
    }
    const ids = new Set<string>();
    for (const beacon of radio.beacons) {
      if (!object(beacon) || !text(beacon.beaconId) || ids.has(beacon.beaconId) ||
          !text(beacon.floorId) || !finite(beacon.x) || !finite(beacon.y) ||
          !within(beacon.referenceRssiAt1m, -127, -1) || !within(beacon.pathLossExponent, 0.1, 10)) {
        throw new Error("Invalid radio beacon");
      }
      ids.add(beacon.beaconId);
    }
    if (!radio.transitions.every((item) => object(item) && text(item.fromFloorId) &&
        text(item.toFloorId) && item.fromFloorId !== item.toFloorId && finite(item.x) && finite(item.y))) {
      throw new Error("Invalid radio floor transition");
    }
  }
  if (value.corridors !== undefined) {
    if (!Array.isArray(value.corridors)) throw new Error("Invalid corridors array");
    const corridorIds = new Set<string>();
    for (const [index, corridor] of value.corridors.entries()) {
      if (!object(corridor) || !text(corridor.id) || !text(corridor.floorId) ||
          !text(corridor.fromNodeId) || !text(corridor.toNodeId) || corridorIds.has(corridor.id) ||
          (corridor.oneWay !== undefined && typeof corridor.oneWay !== "boolean") ||
          !Array.isArray(corridor.geometry) || corridor.geometry.length < 2 ||
          !corridor.geometry.every((point) => object(point) && finite(point.x) && finite(point.y))) {
        throw new Error(`Invalid corridors[${index}]`);
      }
      corridorIds.add(corridor.id);
    }
  }
  let previousArrival = -1;
  for (const [index, observation] of observations.entries()) {
    if (!validObservation(observation, durationMs) || observation.receivedAtMs < previousArrival) {
      throw new Error(`Invalid observations[${index}]: expected arrival order and valid sensor values`);
    }
    previousArrival = observation.receivedAtMs;
  }
  return value as unknown as ReplayFixture;
}

export function applyCheckpointMeasurements(fixture: ReplayFixture, measurements: unknown): ReplayFixture {
  if (fixture.device.platform === "synthetic" || fixture.truth.provenance === "simulated") {
    throw new Error("Checkpoint measurements require a device recording");
  }
  if (fixture.truth.checkpoints.length) throw new Error("Replay already contains coordinate checkpoints");
  if (!Array.isArray(measurements) || !measurements.length || measurements.length > MAX_REPLAY_MARKS) {
    throw new Error("Provide an array of checkpoint measurements");
  }
  const marks = new Map(fixture.marks?.map((mark) => [mark.number, mark.elapsedMs]));
  const checkpoints: ReplayFixture["truth"]["checkpoints"] = [];
  const used = new Set<number>();
  for (const measurement of measurements) {
    if (!object(measurement) || typeof measurement.number !== "number" || !marks.has(measurement.number) ||
        used.has(measurement.number) || !finite(measurement.x) || !finite(measurement.y) || !text(measurement.floorId)) {
      throw new Error("Each measurement needs a unique recorded checkpoint number, finite x/y and a floorId");
    }
    used.add(measurement.number);
    checkpoints.push({
      elapsedMs: marks.get(measurement.number)!, x: measurement.x, y: measurement.y, floorId: measurement.floorId,
    });
  }
  checkpoints.sort((a, b) => a.elapsedMs - b.elapsedMs);
  return parseReplay({ ...fixture, truth: { ...fixture.truth, provenance: "measured", checkpoints } });
}

export function applyWalkSetup(fixture: ReplayFixture, setup: unknown): ReplayFixture {
  if (fixture.device.platform === "synthetic" || fixture.truth.provenance === "simulated") {
    throw new Error("Walk setup requires a device recording");
  }
  if (!object(setup) || !object(setup.start) || !Array.isArray(setup.headings) || !setup.headings.length) {
    throw new Error("Walk setup requires a start and at least one heading segment");
  }
  if (fixture.observations.some((item) => item.kind === "fix" || item.kind === "heading")) {
    throw new Error("Walk setup requires a recording without existing fixes or headings");
  }
  const { start, headings } = setup;
  if (!within(start.elapsedMs, 0, fixture.durationMs) || !text(start.floorId) ||
      !finite(start.x) || !finite(start.y) || !within(start.accuracyM, 0, 1000)) {
    throw new Error("Invalid walk setup start");
  }
  const inputs: PositionObservation[] = [{
    kind: "fix", timestampMs: start.elapsedMs, receivedAtMs: start.elapsedMs,
    floorId: start.floorId, x: start.x, y: start.y, accuracyM: start.accuracyM,
  }];
  let previousEnd = start.elapsedMs;
  let previousDegrees: number | undefined;
  for (const segment of headings) {
    if (!object(segment) || !within(segment.fromMs, previousEnd, fixture.durationMs) ||
        !within(segment.untilMs, segment.fromMs, fixture.durationMs) || segment.fromMs >= segment.untilMs ||
        !within(segment.degrees, 0, 360) || segment.degrees === 360 ||
        !within(segment.accuracyDegrees, 0, 180)) {
      throw new Error("Invalid or overlapping walk heading segment");
    }
    if (previousDegrees !== undefined && segment.fromMs > previousEnd) {
      inputs.push({
        kind: "heading", timestampMs: previousEnd, receivedAtMs: previousEnd,
        degrees: previousDegrees, accuracyDegrees: 180,
      });
    }
    // Regular samples express the tester's known direction over this segment.
    for (let time = segment.fromMs; time < segment.untilMs; time += 1000) {
      inputs.push({
        kind: "heading", timestampMs: time, receivedAtMs: time,
        degrees: segment.degrees, accuracyDegrees: segment.accuracyDegrees,
      });
    }
    previousEnd = segment.untilMs;
    previousDegrees = segment.degrees;
  }
  if (previousDegrees !== undefined && previousEnd < fixture.durationMs) {
    inputs.push({
      kind: "heading", timestampMs: previousEnd, receivedAtMs: previousEnd,
      degrees: previousDegrees, accuracyDegrees: 180,
    });
  }
  return parseReplay({
    ...fixture,
    observations: [...inputs, ...fixture.observations].sort((a, b) => a.receivedAtMs - b.receivedAtMs),
  });
}

function percentile(sorted: number[], fraction: number) {
  return sorted.length ? sorted[Math.ceil(sorted.length * fraction) - 1] : null;
}

export function runReplay(fixture: ReplayFixture, provider: PositioningProvider, matchCorridors = false) {
  const matcher = matchCorridors && fixture.corridors?.length ? createCorridorMatcher(fixture.corridors) : null;
  const radio = matchCorridors && fixture.radio
    ? createRadioPositioning(fixture.radio.beacons, fixture.radio.transitions) : null;
  const lastCapture = new Map<PositionObservation["kind"], number>();
  const estimates: Array<{
    elapsedMs: number;
    estimate: ReturnType<PositioningProvider["estimate"]>;
    positionObservationAtMs: number | null;
    correction?: { capturedAtMs: number; floorId: string };
    corridorMatch?: CorridorMatch;
    floorCandidateId?: string;
  }> = [];
  const timeline = [...new Set([
    ...fixture.observations.map((item) => item.receivedAtMs),
    ...fixture.truth.checkpoints.map((item) => item.elapsedMs),
    ...Array.from({ length: Math.floor(fixture.durationMs / 1000) }, (_, i) => i * 1000),
    fixture.durationMs,
  ])].sort((a, b) => a - b);
  const estimateAt = new Map<number, ReturnType<PositioningProvider["estimate"]>>();
  let observationIndex = 0;
  let positionObservationAtMs: number | null = null;
  let hasFix = false;
  let dropped = 0;
  let lostDurationMs = 0;
  let previousElapsedMs = 0;
  let wasLost = true;
  for (const elapsedMs of timeline) {
    let correction: { capturedAtMs: number; floorId: string } | undefined;
    if (wasLost) lostDurationMs += elapsedMs - previousElapsedMs;
    while (fixture.observations[observationIndex]?.receivedAtMs === elapsedMs) {
      const observation = fixture.observations[observationIndex++];
      // Multiple beacons may legitimately share a capture timestamp.
      const previous = lastCapture.get(observation.kind) ?? -1;
      if (observation.timestampMs > elapsedMs || observation.timestampMs < previous ||
          (observation.timestampMs === previous && observation.kind !== "ble")) {
        dropped++;
        continue;
      }
      lastCapture.set(observation.kind, observation.timestampMs);
      if (observation.kind === "fix" || observation.kind === "motion") {
        positionObservationAtMs = Math.max(positionObservationAtMs ?? 0, observation.timestampMs);
      }
      if (observation.kind === "fix") {
        if (hasFix) correction = { capturedAtMs: observation.timestampMs, floorId: observation.floorId };
        hasFix = true;
        matcher?.reset();
        radio?.reset();
      }
      if (observation.kind === "ble") radio?.observe({
        beaconId: observation.beaconId,
        rssi: observation.rssiDbm,
        timestampMs: observation.timestampMs,
      });
      provider.observe(observation);
    }
    const raw = provider.estimate(elapsedMs);
    const radioEstimate = raw ? radio?.estimate(raw, elapsedMs) : undefined;
    const position = radioEstimate?.position ?? raw;
    const corridorMatch = position ? matcher?.match(position, elapsedMs) : undefined;
    const estimate = corridorMatch?.position ?? position;
    estimates.push({
      elapsedMs,
      estimate,
      positionObservationAtMs,
      ...(correction ? { correction } : {}),
      ...(corridorMatch ? { corridorMatch } : {}),
      ...(radioEstimate?.floorCandidateId ? { floorCandidateId: radioEstimate.floorCandidateId } : {}),
    });
    estimateAt.set(elapsedMs, estimate);
    wasLost = !estimate || estimate.confidence === "lost";
    previousElapsedMs = elapsedMs;
  }
  let wrongFloor = 0;
  let unavailable = 0;
  const errors: number[] = [];
  for (const checkpoint of fixture.truth.checkpoints) {
    const estimate = estimateAt.get(checkpoint.elapsedMs);
    if (!estimate || estimate.confidence === "lost") unavailable++;
    else if (estimate.floorId !== checkpoint.floorId) wrongFloor++;
    else errors.push(Math.hypot(estimate.x - checkpoint.x, estimate.y - checkpoint.y));
  }
  errors.sort((a, b) => a - b);
  const steps = provider.stepCount();
  return {
    algorithm: provider.algorithm + (radio ? "+ble-v1" : "") + (matcher ? "+corridor-v2" : ""),
    fixtureId: fixture.fixtureId,
    truth: fixture.truth.provenance,
    steps,
    stepCountError: fixture.truth.stepCount === undefined ? null : steps - fixture.truth.stepCount,
    dropped,
    lostDurationMs,
    checkpointCount: fixture.truth.checkpoints.length,
    comparableCheckpoints: errors.length,
    wrongFloor,
    unavailable,
    medianErrorM: percentile(errors, 0.5),
    p95ErrorM: percentile(errors, 0.95),
    estimates,
  };
}

export function compareReplay(fixture: ReplayFixture, stepLengthM = 0.7) {
  const walking = () => createWalkingProvider(fixture, { stepLengthM, useMotion: true });
  const baseline = runReplay(fixture, createWalkingProvider(fixture, { stepLengthM, useMotion: false }));
  const withoutMatching = runReplay(fixture, walking());
  if (!fixture.corridors?.length && !fixture.radio) return { baseline, candidate: withoutMatching };
  return {
    baseline,
    withoutMatching,
    candidate: runReplay(fixture, walking(), true),
  };
}
