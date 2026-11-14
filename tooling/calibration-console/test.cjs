const assert = require("node:assert/strict");
const { applyCheckpointMeasurements, applyWalkSetup, compareReplay, parseReplay, createScenario, scenarioNames } = require("./replay.cjs");
const { createCorridorMatcher, startRecording } = require("@atlas/positioning-core");
const { parseGuidancePlan, replayGuidance } = require("./src/guidance.ts");

const guidanceFixture = createScenario("straight");
const guidancePlan = {
  venueId: guidanceFixture.venueId, mapVersionId: guidanceFixture.mapVersionId,
  floors: [
    { floorId: "ground", polyline: [[0, 0], [4, 0]] },
    { floorId: "upper", polyline: [[4, 0], [8, 0]] },
  ],
  confirmations: [{ elapsedMs: 500, floorId: "upper" }, { elapsedMs: 2600, floorId: "upper" }],
};
const initialEstimate = compareReplay(guidanceFixture).candidate.estimates[0].estimate;
const guidanceSamples = [
  [0, 0, "ground"], [1000, 2, "ground"], [1500, 4, "ground"],
  [2500, 4, "ground"], [2550, 4, "upper"], [2650, 4, "upper"],
  [3600, 6, "upper"], [4100, 8, "upper"], [5100, 8, "upper"],
].map(([elapsedMs, x, floorId]) => ({
  elapsedMs, positionObservationAtMs: elapsedMs, estimate: { ...initialEstimate, x, y: 0, floorId },
}));
const parsedGuidance = parseGuidancePlan(guidancePlan, guidanceFixture);
const guidance = replayGuidance(guidanceFixture.venueId, parsedGuidance, guidanceSamples);
assert.equal(guidance.arrivalMs, 5100);
assert.equal(guidance.remainingM, 0);
assert.deepEqual(guidance.confirmations.map((entry) => entry.accepted), [false, true]);
assert.equal(replayGuidance(guidanceFixture.venueId, { ...parsedGuidance, confirmations: [] }, guidanceSamples).status, "confirm-floor");
assert.throws(() => parseGuidancePlan({ ...guidancePlan, mapVersionId: "other" }, guidanceFixture), /match the replay/);
const cornerPlan = parseGuidancePlan({
  ...guidancePlan, floors: [{ floorId: "ground", polyline: [[0, 0], [4, 0], [4, 4]] }], confirmations: [],
}, guidanceFixture);
const cornerGuidance = replayGuidance(guidanceFixture.venueId, cornerPlan, [
  { elapsedMs: 0, positionObservationAtMs: 0, estimate: { ...initialEstimate, x: 0, y: 0, floorId: "ground" } },
  { elapsedMs: 500, positionObservationAtMs: null, estimate: null },
]);
assert.deepEqual(cornerGuidance.turnPrompts, [{ elapsedMs: 0, legIndex: 0, turn: { direction: "right", distanceM: 4 } }]);
assert.equal(cornerGuidance.status, "uncertain");
const endpointPlan = parseGuidancePlan({
  ...guidancePlan, floors: [{ floorId: "ground", polyline: [[0, 0], [4, 0]] }], confirmations: [],
}, guidanceFixture);
const stationary = { ...initialEstimate, floorId: "ground", x: 4, y: 0 };
const endpointSamples = [
  { elapsedMs: 0, positionObservationAtMs: 0, estimate: stationary },
  { elapsedMs: 1000, positionObservationAtMs: 0, estimate: stationary },
  { elapsedMs: 2000, positionObservationAtMs: 0, estimate: stationary },
  { elapsedMs: 3000, positionObservationAtMs: 3000, estimate: stationary },
];
const interrupted = replayGuidance(guidanceFixture.venueId, endpointPlan, endpointSamples);
assert.equal(interrupted.arrivalMs, null);
assert.equal(interrupted.staleSamples, 1);
assert.deepEqual(interrupted.transitions.map((entry) => entry.status), ["following", "uncertain", "following"]);
assert.equal(replayGuidance(guidanceFixture.venueId, endpointPlan, [
  ...endpointSamples, { elapsedMs: 4000, positionObservationAtMs: 4000, estimate: stationary },
]).arrivalMs, 4000);
const fixOnly = parseReplay({
  ...guidanceFixture,
  observations: [{ ...guidanceFixture.observations[0], x: 4, y: 0 }],
});
const fixOnlyReport = compareReplay(fixOnly).candidate;
assert.equal(fixOnlyReport.estimates.at(-1).positionObservationAtMs, 0);
assert.equal(replayGuidance(fixOnly.venueId, endpointPlan, fixOnlyReport.estimates).status, "uncertain");
const offRoute = { ...stationary, y: 10 };
const offRouteSamples = [0, 1000, 2000, 3000].map((elapsedMs) => ({
  elapsedMs, positionObservationAtMs: 0, estimate: offRoute,
}));
assert.equal(replayGuidance(fixOnly.venueId, endpointPlan, offRouteSamples).status, "uncertain");
assert.equal(replayGuidance(fixOnly.venueId, endpointPlan,
  offRouteSamples.map((sample) => ({ ...sample, positionObservationAtMs: sample.elapsedMs })),
).status, "off-route");
const correctedFixture = parseReplay({
  ...guidanceFixture,
  observations: [
    { ...guidanceFixture.observations[0], x: 0, y: 0, floorId: "wrong-floor" },
    { ...guidanceFixture.observations[0], x: 1, y: 0, timestampMs: 1000, receivedAtMs: 1200 },
  ],
});
const corrected = replayGuidance(correctedFixture.venueId, endpointPlan, compareReplay(correctedFixture).candidate.estimates);
assert.deepEqual(corrected.corrections, [{
  elapsedMs: 1200, capturedAtMs: 1000, floorId: "ground", previousStatus: "uncertain", recoveredAfterMs: 0,
}]);
const wrongTurn = replayGuidance(guidanceFixture.venueId, endpointPlan, [
  ...offRouteSamples.map((sample) => ({ ...sample, positionObservationAtMs: sample.elapsedMs })),
  {
    elapsedMs: 3500, positionObservationAtMs: 3500,
    estimate: { ...stationary, x: 1 },
    correction: { capturedAtMs: 3500, floorId: "ground" },
  },
]);
assert.equal(wrongTurn.corrections[0].previousStatus, "off-route");
assert.equal(wrongTurn.corrections[0].recoveredAfterMs, 0);
const delayedRecovery = replayGuidance(guidanceFixture.venueId, endpointPlan, [
  { elapsedMs: 2500, positionObservationAtMs: 2500, estimate: stationary, correction: { capturedAtMs: 0, floorId: "ground" } },
  { elapsedMs: 3000, positionObservationAtMs: 3000, estimate: { ...stationary, floorId: "upper" } },
]);
assert.equal(delayedRecovery.corrections[0].recoveredAfterMs, null);
const delayedButFresh = replayGuidance(guidanceFixture.venueId, endpointPlan, [
  { elapsedMs: 1000, positionObservationAtMs: 1000, estimate: { ...stationary, floorId: "wrong-floor" } },
  { elapsedMs: 1100, positionObservationAtMs: 1000, estimate: stationary, correction: { capturedAtMs: 950, floorId: "ground" } },
]);
assert.equal(delayedButFresh.corrections[0].recoveredAfterMs, 0);

const verticalFixture = createScenario("straight");
const verticalMotion = verticalFixture.observations.find((item) => item.kind === "motion");
verticalFixture.device.motionSource = "device-motion";
verticalMotion.verticalAccelerationMps2 = -0.5;
assert.equal(parseReplay(verticalFixture).observations.find((item) => item.kind === "motion").verticalAccelerationMps2, -0.5);
verticalMotion.verticalAccelerationMps2 = Infinity;
assert.throws(() => parseReplay(verticalFixture), /observation/i);

for (const seed of [42, 101]) {
  for (const name of scenarioNames) {
    const fixture = parseReplay(createScenario(name, seed));
    const report = compareReplay(fixture);
    assert.deepEqual(compareReplay(parseReplay(createScenario(name, seed))), report, name);
    assert.equal(report.candidate.steps, fixture.truth.stepCount, name);
    assert.equal(report.candidate.truth, "simulated", name);
    assert.equal(report.candidate.checkpointCount, name === "radio-drift" ? 3 : 4, name);
    if (name === "late-packets" || name === "stale-radio") assert.equal(report.candidate.dropped, 1);
    if (name === "straight" || name === "corner") {
      assert.ok(report.candidate.p95ErrorM < 0.6, name);
      assert.ok(report.baseline.p95ErrorM > 2, name);
    }
    if (name === "wrong-floor") {
      assert.equal(report.candidate.wrongFloor, 4);
      assert.equal(report.candidate.p95ErrorM, null);
    }
    if (name === "missing-start") {
      assert.equal(report.candidate.unavailable, 4);
      assert.equal(report.candidate.lostDurationMs, fixture.durationMs);
    }
    if (name === "manual-correction") {
      const before = report.candidate.estimates.find((item) => item.elapsedMs === 3560).estimate;
      const after = report.candidate.estimates.find((item) => item.elapsedMs === 3600).estimate;
      const checkpoint = fixture.truth.checkpoints[1];
      assert.ok(Math.hypot(before.x - checkpoint.x, before.y - checkpoint.y) > 1);
      assert.equal(after.x, checkpoint.x);
      assert.equal(after.y, checkpoint.y);
    }
    if (name === "pocket") {
      assert.equal(report.candidate.estimates.at(-1).estimate.x, 5);
      assert.equal(report.candidate.estimates.at(-1).estimate.headingDegrees, null);
    }
    if (name === "corridor-drift") {
      const first = report.candidate.estimates[0].corridorMatch;
      assert.equal(first.raw.y, 5.9);
      assert.equal(first.position.y, 5);
      assert.equal(first.position.confidenceScore, first.raw.confidenceScore);
      assert.ok(report.candidate.p95ErrorM < 0.6);
      assert.ok(report.withoutMatching.p95ErrorM >= 0.9);
    }
    if (name === "radio-drift") {
      assert.ok(report.candidate.p95ErrorM < report.withoutMatching.p95ErrorM);
      const timeline = report.candidate.estimates;
      assert.ok(timeline.some((item) => item.estimate.sourceContributions.includes("ble")));
      for (let index = 1; index < timeline.length; index++) {
        assert.ok(Math.abs(timeline[index].estimate.x - timeline[index - 1].estimate.x) <= 0.75);
      }
    }
    if (name === "radio-outlier") {
      assert.ok(report.candidate.estimates.every((item) => !item.estimate.sourceContributions.includes("ble")));
    }
    if (name.startsWith("floor-")) {
      const guesses = report.candidate.estimates.filter((item) => item.floorCandidateId);
      assert.equal(guesses.length > 0, name === "floor-candidate", name);
      assert.ok(guesses.every((item) => item.floorCandidateId === "level-1" &&
        item.estimate.floorId === "ground" && item.elapsedMs >= 1900 && item.elapsedMs <= 5400));
    }
  }
}
const malformed = createScenario("straight");
malformed.observations[0].receivedAtMs = 40;
assert.throws(() => parseReplay(malformed), /arrival order/);
assert.throws(() => parseReplay({ ...createScenario("straight"), schemaVersion: 2 }), /schema version/);
let clock = 100;
const recorder = startRecording({
  fixtureId: "capture-test", venueId: "virtual", mapVersionId: null,
  startedAt: "2026-01-01T00:00:00.000Z", seed: 0, device: { platform: "android", carrying: "handheld" },
}, () => clock, 1);
clock = 110;
const fix = { kind: "fix", floorId: "ground", x: 5, y: 5, accuracyM: 1 };
assert.equal(recorder.record(fix, 99), false);
assert.equal(recorder.record(fix, 105), true);
assert.equal(recorder.record(fix), false);
clock = 120;
assert.equal(recorder.markCheckpoint(), 1);
assert.equal(recorder.markCheckpoint(), null);
clock = 125;
assert.equal(recorder.markCheckpoint(), 2);
clock = 120;
const recorded = parseReplay(recorder.stop());
assert.deepEqual(recorded.observations, [{ ...fix, receivedAtMs: 10, timestampMs: 5 }]);
assert.equal(recorded.durationMs, 25);
assert.deepEqual(recorded.marks, [{ number: 1, elapsedMs: 20 }, { number: 2, elapsedMs: 25 }]);
assert.equal(recorded.truth.provenance, "unlabelled");
assert.equal(compareReplay(recorded).candidate.p95ErrorM, null);
assert.equal(recorder.record(fix), false);
assert.equal(recorder.markCheckpoint(), null);
const measured = applyCheckpointMeasurements(recorded, [
  { number: 2, floorId: "ground", x: 8, y: 5 },
  { number: 1, floorId: "ground", x: 7, y: 5 },
]);
assert.equal(measured.truth.provenance, "measured");
assert.deepEqual(measured.truth.checkpoints.map((item) => item.elapsedMs), [20, 25]);
assert.equal(compareReplay(measured).candidate.p95ErrorM, 3);
const noStart = applyCheckpointMeasurements({ ...recorded, observations: [] }, [
  { number: 1, floorId: "ground", x: 7, y: 5 },
]);
assert.equal(compareReplay(noStart).candidate.p95ErrorM, null);
assert.ok(compareReplay(noStart).candidate.estimates.every((item) => item.estimate === null));
assert.deepEqual(recorded.truth.checkpoints, []);
assert.throws(() => applyCheckpointMeasurements(recorded, [{ number: 3, floorId: "ground", x: 8, y: 5 }]), /recorded checkpoint/);
assert.throws(() => parseReplay({ ...recorded, marks: [{ number: 1, elapsedMs: 26 }] }), /Invalid marks/);
const walk = createScenario("corner", 101);
const manualWalk = {
  ...walk, device: { platform: "android", carrying: "handheld" },
  truth: { provenance: "unlabelled", checkpoints: [] },
  observations: walk.observations.filter((item) => item.kind === "motion"),
  marks: [{ number: 1, elapsedMs: walk.durationMs }],
};
const setup = {
  start: { elapsedMs: 0, x: 5, y: 5, floorId: "ground", accuracyM: 0.6 },
  headings: [
    { fromMs: 0, untilMs: 3000, degrees: 90, accuracyDegrees: 8 },
    { fromMs: 3000, untilMs: 6000, degrees: 180, accuracyDegrees: 8 },
  ],
};
const endpoint = walk.truth.checkpoints.at(-1);
const evaluated = applyCheckpointMeasurements(applyWalkSetup(manualWalk, setup), [
  { number: 1, floorId: endpoint.floorId, x: endpoint.x, y: endpoint.y },
]);
const evaluatedReport = compareReplay(evaluated);
assert.equal(evaluatedReport.candidate.checkpointCount, 1);
assert.ok(evaluatedReport.candidate.p95ErrorM < evaluatedReport.baseline.p95ErrorM);
assert.equal(evaluatedReport.candidate.estimates.at(-1).estimate.headingDegrees, null);
assert.ok(manualWalk.observations.every((item) => item.kind === "motion"));
assert.throws(() => applyWalkSetup(walk, setup), /device recording/);
assert.throws(() => applyWalkSetup(evaluated, setup), /existing fixes or headings/);
assert.throws(() => applyWalkSetup(manualWalk, {
  ...setup, headings: [setup.headings[0], { ...setup.headings[1], fromMs: 2999 }],
}), /overlapping/);
const corridorScenario = createScenario("corridor-drift");
const eastWest = corridorScenario.corridors[0];
const parallel = { ...eastWest, id: "parallel", fromNodeId: "parallel-w", toNodeId: "parallel-e",
  geometry: [{ x: 0, y: 7 }, { x: 20, y: 7 }] };
const matcher = createCorridorMatcher([eastWest, parallel]);
const raw = compareReplay(corridorScenario).candidate.estimates[0].corridorMatch.raw;
assert.equal(matcher.match({ ...raw, y: 6 }, 0).reason, "ambiguous");
assert.equal(matcher.match({ ...raw, y: 5.1 }, 100).corridorId, eastWest.id);
assert.equal(matcher.match({ ...raw, y: 7 }, 200).reason, "off-graph");
assert.equal(matcher.match({ ...raw, y: 7, floorId: null }, 300).reason, "unknown-floor");
assert.equal(matcher.match({ ...raw, y: 7 }, 400).corridorId, parallel.id);
assert.equal(matcher.match({ ...raw, confidence: "lost" }, 500).reason, "lost");
console.log(`Position replay: ${scenarioNames.length} scenarios on two seeds, including corridor, radio and floor checks, passed.`);
