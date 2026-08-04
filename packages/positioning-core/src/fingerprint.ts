// Fingerprint-based positioning mode (techspec.md §6.7 "fingerprint"
// approach). A k-NN matcher over a pre-surveyed RSSI radiomap, modeled on
// the UJIIndoorLoc-style benchmarks in litanli/indoor-locationing (1-NN with
// Manhattan distance performed best on that public dataset). Deep-learning
// CSI regression (as in zhangleino1/WIFI-SCI-Indoor-Positioning) is a
// possible future upgrade path but is out of scope while using off-the-shelf
// phone RSSI rather than raw CSI.

import type { PositionFix2D } from "./ble";

export interface FingerprintSample {
  x: number;
  y: number;
  floorId: string;
  /** beaconId/AP identifier -> RSSI reading at this surveyed point. */
  signalVector: Record<string, number>;
}

export interface FingerprintRadiomap {
  samples: FingerprintSample[];
}

function manhattanDistance(a: Record<string, number>, b: Record<string, number>, missingPenaltyDb: number): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let distance = 0;
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (av === undefined || bv === undefined) {
      distance += missingPenaltyDb;
      continue;
    }
    distance += Math.abs(av - bv);
  }
  return distance;
}

export interface FingerprintMatcherConfig {
  k: number;
  missingPenaltyDb: number;
}

export const DEFAULT_FINGERPRINT_CONFIG: FingerprintMatcherConfig = {
  k: 1,
  missingPenaltyDb: 100,
};

/** k-NN fingerprint match. k=1 with Manhattan distance is the recommended default. */
export function matchFingerprint(
  observed: Record<string, number>,
  radiomap: FingerprintRadiomap,
  config: FingerprintMatcherConfig = DEFAULT_FINGERPRINT_CONFIG
): PositionFix2D | null {
  if (radiomap.samples.length === 0) return null;

  const ranked = radiomap.samples
    .map((sample) => ({ sample, distance: manhattanDistance(observed, sample.signalVector, config.missingPenaltyDb) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(1, config.k));

  const floorId = ranked[0].sample.floorId;
  const x = ranked.reduce((sum, r) => sum + r.sample.x, 0) / ranked.length;
  const y = ranked.reduce((sum, r) => sum + r.sample.y, 0) / ranked.length;

  return { x, y, floorId, estimatedAccuracyM: 4 };
}
