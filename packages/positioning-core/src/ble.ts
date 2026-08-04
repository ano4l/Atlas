// BLE positioning strategies behind a common interface (techspec.md §6.7):
// nearest-beacon, weighted-centroid, trilateration/multilateration, and
// fingerprint (see fingerprint.ts). Modeled on the trilateration approach in
// Navigine/Indoor-Positioning-And-Navigation-Algorithms, adapted to
// TypeScript for on-device use in apps/mobile.
//
// RSSI is never treated as an exact distance (techspec.md §6.7) — the path-
// loss conversion below is deliberately approximate and must be replaced by
// a per-zone calibrated model before pilot use.

export interface BeaconObservation {
  beaconId: string;
  rssi: number;
  timestampMs: number;
}

export interface CalibratedBeacon {
  beaconId: string;
  floorId: string;
  x: number;
  y: number;
  /** Measured RSSI at 1 metre, used for the log-distance path-loss model. */
  referenceRssiAt1m: number;
  /** Environment path-loss exponent (2 = free space, higher = more obstructed). */
  pathLossExponent: number;
}

export interface PositionFix2D {
  x: number;
  y: number;
  floorId: string;
  /** Diagnostic only — not a calibrated accuracy guarantee. */
  estimatedAccuracyM: number;
}

/** Log-distance path-loss model. Must be calibrated per venue/zone. */
export function rssiToDistanceM(observation: BeaconObservation, beacon: CalibratedBeacon): number {
  const exponent = 10 * beacon.pathLossExponent;
  return Math.pow(10, (beacon.referenceRssiAt1m - observation.rssi) / exponent);
}

export interface BeaconPositioningStrategy {
  estimate(observations: BeaconObservation[], beacons: Map<string, CalibratedBeacon>): PositionFix2D | null;
}

/** Simplest baseline: snap to the strongest observed beacon's coordinates. */
export const nearestBeaconStrategy: BeaconPositioningStrategy = {
  estimate(observations, beacons) {
    const strongest = [...observations].sort((a, b) => b.rssi - a.rssi)[0];
    if (!strongest) return null;
    const beacon = beacons.get(strongest.beaconId);
    if (!beacon) return null;
    return { x: beacon.x, y: beacon.y, floorId: beacon.floorId, estimatedAccuracyM: 5 };
  },
};

/** Weighted centroid using inverse-distance weighting from RSSI-derived ranges. */
export const weightedCentroidStrategy: BeaconPositioningStrategy = {
  estimate(observations, beacons) {
    let sumWeight = 0;
    let sumX = 0;
    let sumY = 0;
    let floorId: string | null = null;

    for (const obs of observations) {
      const beacon = beacons.get(obs.beaconId);
      if (!beacon) continue;
      const distance = Math.max(rssiToDistanceM(obs, beacon), 0.1);
      const weight = 1 / (distance * distance);
      sumWeight += weight;
      sumX += beacon.x * weight;
      sumY += beacon.y * weight;
      floorId = floorId ?? beacon.floorId;
    }

    if (sumWeight === 0 || floorId === null) return null;
    return { x: sumX / sumWeight, y: sumY / sumWeight, floorId, estimatedAccuracyM: 3 };
  },
};

/**
 * Multilateration via linear least squares over >=3 beacon ranges
 * (trilateration when exactly 3). Solves the linearized system obtained by
 * subtracting pairwise circle equations, avoiding an iterative nonlinear
 * solve for the Phase 2/3 baseline.
 */
export const trilaterationStrategy: BeaconPositioningStrategy = {
  estimate(observations, beacons) {
    const ranged = observations
      .map((obs) => {
        const beacon = beacons.get(obs.beaconId);
        if (!beacon) return null;
        return { beacon, distance: rssiToDistanceM(obs, beacon) };
      })
      .filter((v): v is { beacon: CalibratedBeacon; distance: number } => v !== null);

    if (ranged.length < 3) return weightedCentroidStrategy.estimate(observations, beacons);

    const [ref, ...rest] = ranged;
    // Linear system A * [x, y]^T = b, from (xi - x1)x + (yi - y1)y = 0.5 * (ri^2 - r1^2 - xi^2 + x1^2 - yi^2 + y1^2)
    const A: number[][] = [];
    const b: number[] = [];

    for (const { beacon, distance } of rest) {
      A.push([beacon.x - ref.beacon.x, beacon.y - ref.beacon.y]);
      b.push(
        0.5 *
          (distance * distance -
            ref.distance * ref.distance -
            beacon.x * beacon.x +
            ref.beacon.x * ref.beacon.x -
            beacon.y * beacon.y +
            ref.beacon.y * ref.beacon.y) *
          -1
      );
    }

    // Solve least squares via normal equations: (A^T A) x = A^T b
    const AtA = [
      [0, 0],
      [0, 0],
    ];
    const Atb = [0, 0];
    for (let i = 0; i < A.length; i++) {
      const [a0, a1] = A[i];
      AtA[0][0] += a0 * a0;
      AtA[0][1] += a0 * a1;
      AtA[1][0] += a1 * a0;
      AtA[1][1] += a1 * a1;
      Atb[0] += a0 * b[i];
      Atb[1] += a1 * b[i];
    }

    const det = AtA[0][0] * AtA[1][1] - AtA[0][1] * AtA[1][0];
    if (Math.abs(det) < 1e-9) return weightedCentroidStrategy.estimate(observations, beacons);

    const x = (Atb[0] * AtA[1][1] - Atb[1] * AtA[0][1]) / det;
    const y = (Atb[1] * AtA[0][0] - Atb[0] * AtA[1][0]) / det;

    return { x, y, floorId: ref.beacon.floorId, estimatedAccuracyM: 2 };
  },
};
