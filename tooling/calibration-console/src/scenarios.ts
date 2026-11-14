import type { PositionObservation } from "@atlas/positioning-core";
import type { ReplayFixture } from "./index";

export const scenarioNames = [
  "straight", "corner", "stop-and-resume", "rotate-in-place", "pocket",
  "missing-radio", "noisy-radio", "stale-radio", "late-packets",
  "wrong-floor", "manual-correction", "missing-start", "corridor-drift",
  "radio-drift", "radio-outlier", "floor-candidate", "floor-away-from-transition", "floor-mixed-signals",
] as const;
type Scenario = typeof scenarioNames[number];

export function createScenario(name: Scenario, seed = 42): ReplayFixture {
  if (name.startsWith("radio-") || name.startsWith("floor-")) return radioScenario(name, seed);
  const durationMs = 8000;
  const stepTimes = name === "rotate-in-place" ? [] : [400, 1000, 1600, 2200, 2800, 3400, 4000, 4600, 5200];
  if (name === "stop-and-resume") stepTimes.splice(3, 3);
  const observations: PositionObservation[] = [];
  const checkpoints: ReplayFixture["truth"]["checkpoints"] = [];
  let randomState = seed >>> 0;
  let x = 5;
  let y = 5;
  const direction = (time: number) => {
    if (name === "rotate-in-place") return (Math.floor(time / 1000) * 45) % 360;
    return name === "corner" && time >= 3000 ? 180 : 90;
  };
  const add = (observation: PositionObservation) => observations.push(observation);
  if (name !== "missing-start") add({
    kind: "fix", timestampMs: 0, receivedAtMs: 0, x, y: name === "corridor-drift" ? y + 0.9 : y,
    floorId: name === "wrong-floor" ? "level-1" : "ground", accuracyM: 0.6,
  });
  for (let time = 0; time <= durationMs; time += 40) {
    if (time % 200 === 0) add({
      kind: "heading", timestampMs: time, receivedAtMs: time,
      degrees: direction(time) + (name === "manual-correction" && time < 3600 ? 30 : 0),
      accuracyDegrees: name === "pocket" ? 50 : 8,
    });
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    const noise = randomState / 4294967296 * 0.3 - 0.15;
    const pulse = stepTimes.includes(time) ? 2.2 : 0;
    const magnitude = 9.80665 + noise + pulse;
    const angle = name === "pocket" || name === "rotate-in-place" ? time / 150 : 0;
    add({
      kind: "motion", timestampMs: time,
      receivedAtMs: name === "late-packets" && time === 800 ? 1600 : time,
      accelerationX: magnitude * Math.sin(angle),
      accelerationY: 0,
      accelerationZ: magnitude * Math.cos(angle),
    });
    if (time % 800 === 0 && name !== "missing-radio" && name !== "stale-radio") add({
      kind: "ble", timestampMs: time, receivedAtMs: time, beaconId: "virtual-a",
      rssiDbm: name === "noisy-radio" ? -88 + (randomState % 48) : -68,
    });
    if (stepTimes.includes(time)) {
      const radians = direction(time) * Math.PI / 180;
      const strideM = 0.62 + (randomState % 17) * 0.01;
      x += Math.sin(radians) * strideM;
      y -= Math.cos(radians) * strideM;
    }
    if (time === 3600 && name === "manual-correction") add({
      kind: "fix", timestampMs: time, receivedAtMs: time, x, y, floorId: "ground", accuracyM: 0.3,
    });
    if (time === 0 || time === 3600 || time === 5600 || time === durationMs) {
      checkpoints.push({ elapsedMs: time, x, y, floorId: "ground" });
    }
  }
  if (name === "stale-radio") {
    add({ kind: "ble", timestampMs: 800, receivedAtMs: 800, beaconId: "virtual-a", rssiDbm: -62 });
    add({ kind: "ble", timestampMs: 400, receivedAtMs: 7200, beaconId: "virtual-a", rssiDbm: -60 });
  }
  observations.sort((a, b) => a.receivedAtMs - b.receivedAtMs);
  return {
    schemaVersion: 1, fixtureId: name, venueId: "virtual-replay-venue", mapVersionId: null,
    durationMs, startedAt: "2026-01-01T00:00:00.000Z", seed,
    device: { platform: "synthetic", carrying: name === "pocket" ? "pocket" : "handheld" },
    truth: { provenance: "simulated", checkpoints, stepCount: stepTimes.length },
    observations,
    ...(name === "corridor-drift" ? {
      corridors: [{
        id: "ground-main", floorId: "ground", fromNodeId: "west", toNodeId: "east",
        geometry: [{ x: 0, y: 5 }, { x: 20, y: 5 }],
      }],
    } : {}),
  };
}

function radioScenario(name: Scenario, seed: number): ReplayFixture {
  const fixture = createScenario("rotate-in-place", seed);
  const isFloorScenario = name.startsWith("floor-");
  const beaconFloor = isFloorScenario ? "level-1" : "ground";
  const center = name === "radio-outlier" ? 15 : 5;
  const beacons = [-1, 0, 1].map((offset, index) => ({
    beaconId: "cluster-" + index,
    floorId: beaconFloor,
    x: center + offset,
    y: 5,
    referenceRssiAt1m: -60,
    pathLossExponent: 2,
  }));
  if (name === "floor-mixed-signals") beacons.push(...beacons.map((beacon) => ({
    ...beacon, beaconId: beacon.beaconId + "-ground", floorId: "ground",
  })));
  fixture.observations = fixture.observations.filter((item) => item.kind !== "ble").map((item) =>
    item.kind === "fix" && name === "radio-drift" ? { ...item, x: 6.8, accuracyM: 1.2 } : item,
  );
  for (const timestampMs of [400, 1200, 2000, 2800, 3600, 4400]) {
    for (const beacon of beacons) {
      fixture.observations.push({
        kind: "ble", beaconId: beacon.beaconId, timestampMs, receivedAtMs: timestampMs, rssiDbm: -64,
      });
    }
  }
  fixture.observations.sort((a, b) => a.receivedAtMs - b.receivedAtMs);
  fixture.fixtureId = name;
  if (name === "radio-drift") {
    // Evaluate the fix after the first radio correction has had time to run.
    fixture.truth.checkpoints = fixture.truth.checkpoints.filter((point) => point.elapsedMs > 0);
  }
  fixture.radio = {
    beacons,
    transitions: isFloorScenario ? [{
      fromFloorId: "ground", toFloorId: "level-1", x: name === "floor-away-from-transition" ? 15 : 5, y: 5,
    }] : [],
  };
  return fixture;
}
