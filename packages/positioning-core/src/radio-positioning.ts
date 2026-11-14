import { rssiToDistanceM, weightedCentroidStrategy } from "./ble";
import type { BeaconObservation, CalibratedBeacon } from "./ble";
import type { PositionEstimate } from "./index";

export type FloorTransition = {
  fromFloorId: string;
  toFloorId: string;
  x: number;
  y: number;
};

const WINDOW_MS = 2500;
const MIN_BEACONS = 3;
const MAX_RANGE_M = 12;
const CORRECTION_INTERVAL_MS = 1000;
const FLOOR_CONFIRMATION_MS = 1500;

export function createRadioPositioning(
  beacons: readonly CalibratedBeacon[],
  transitions: readonly FloorTransition[],
) {
  const registry = new Map(beacons.filter((beacon) =>
    Number.isFinite(beacon.x) && Number.isFinite(beacon.y) &&
    Number.isFinite(beacon.referenceRssiAt1m) && Number.isFinite(beacon.pathLossExponent) &&
    beacon.pathLossExponent > 0,
  ).map((beacon) => [beacon.beaconId, beacon]));
  const readings = new Map<string, BeaconObservation>();
  let offsetX = 0;
  let offsetY = 0;
  let lastCorrection = -Infinity;
  let correctionReading = -Infinity;
  let candidate: { floorId: string; since: number; firstSampleMs: number } | undefined;

  return {
    reset() {
      readings.clear();
      offsetX = 0;
      offsetY = 0;
      lastCorrection = -Infinity;
      correctionReading = -Infinity;
      candidate = undefined;
    },
    observe(reading: BeaconObservation) {
      const previous = readings.get(reading.beaconId);
      if (registry.has(reading.beaconId) && Number.isFinite(reading.rssi) &&
          reading.rssi >= -127 && reading.rssi < 0 && Number.isFinite(reading.timestampMs) &&
          (!previous || reading.timestampMs > previous.timestampMs)) {
        readings.set(reading.beaconId, reading);
      }
    },
    estimate(raw: PositionEstimate, now: number) {
      const groups = new Map<string, BeaconObservation[]>();
      for (const [id, reading] of readings) {
        const beacon = registry.get(id)!;
        const age = now - reading.timestampMs;
        if (age < 0 || age > WINDOW_MS || rssiToDistanceM(reading, beacon) > MAX_RANGE_M) continue;
        const floor = groups.get(beacon.floorId) ?? [];
        floor.push(reading);
        groups.set(beacon.floorId, floor);
      }
      const [strongest, runnerUp] = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
      const dominant = strongest && strongest[1].length >= MIN_BEACONS &&
        strongest[1].length > (runnerUp?.[1].length ?? 0) ? strongest : undefined;
      const atTransition = (toFloor: string) => transitions.some((transition) =>
        transition.fromFloorId === raw.floorId && transition.toFloorId === toFloor &&
        Math.hypot(raw.x + offsetX - transition.x, raw.y + offsetY - transition.y) <= 4,
      );

      let floorCandidateId: string | null = null;
      const newest = dominant ? Math.max(...dominant[1].map((sample) => sample.timestampMs)) : -Infinity;
      if (dominant && raw.confidence !== "lost" && dominant[0] !== raw.floorId && atTransition(dominant[0])) {
        if (candidate?.floorId !== dominant[0]) {
          candidate = { floorId: dominant[0], since: now, firstSampleMs: newest };
        }
        if (now - candidate.since >= FLOOR_CONFIRMATION_MS && newest > candidate.firstSampleMs &&
            now - newest <= CORRECTION_INTERVAL_MS) floorCandidateId = candidate.floorId;
      } else {
        candidate = undefined;
      }

      if (raw.confidence !== "lost" && dominant?.[0] === raw.floorId &&
          now - lastCorrection >= CORRECTION_INTERVAL_MS && newest > correctionReading) {
        correctionReading = newest;
        const fix = weightedCentroidStrategy.estimate(dominant[1], registry);
        if (fix) {
          const dx = fix.x - (raw.x + offsetX);
          const dy = fix.y - (raw.y + offsetY);
          const distance = Math.hypot(dx, dy);
          // Reject implausible radio jumps and limit each accepted adjustment.
          if (distance <= Math.min(6, Math.max(2, raw.horizontalAccuracyM * 2))) {
            const weight = Math.min(0.25, 0.75 / Math.max(distance, 0.01));
            offsetX += dx * weight;
            offsetY += dy * weight;
            lastCorrection = now;
          }
        }
      }

      const position = raw.confidence !== "lost" && (offsetX !== 0 || offsetY !== 0)
        ? {
            ...raw,
            x: raw.x + offsetX,
            y: raw.y + offsetY,
            sourceContributions: [...raw.sourceContributions, "ble" as const],
          }
        : raw;
      return { position, floorCandidateId };
    },
  };
}
