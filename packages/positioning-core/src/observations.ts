import type { MotionSample, PositionEstimate } from "./index";
import type { Corridor } from "./map-match";
import type { CalibratedBeacon } from "./ble";
import type { FloorTransition } from "./radio-positioning";

type Captured = { timestampMs: number; receivedAtMs: number; sensorTimestampSeconds?: number };

export type PositionObservation = Captured & (
  | ({ kind: "motion"; verticalAccelerationMps2?: number } & Omit<MotionSample, "timestampMs">)
  | { kind: "heading"; degrees: number; accuracyDegrees: number }
  | { kind: "ble"; beaconId: string; rssiDbm: number }
  | { kind: "pressure"; hectopascals: number }
  | { kind: "fix"; floorId: string; x: number; y: number; accuracyM: number }
);

export interface PositioningProvider {
  readonly algorithm: string;
  observe(observation: PositionObservation): void;
  estimate(elapsedMs: number): PositionEstimate | null;
  stepCount(): number;
}

export interface PositioningSession {
  venueId: string;
  startedAt: string;
  seed: number;
}

export const MAX_REPLAY_MARKS = 30;

export interface ReplayFixture extends PositioningSession {
  schemaVersion: 1;
  fixtureId: string;
  mapVersionId: string | null;
  durationMs: number;
  device: {
    platform: "ios" | "android" | "synthetic";
    carrying: string;
    timestampBasis?: "receipt" | "synchronized";
    motionSource?: "device-motion" | "accelerometer";
  };
  truth: {
    provenance: "measured" | "simulated" | "unlabelled";
    checkpoints: Array<{ elapsedMs: number; x: number; y: number; floorId: string }>;
    stepCount?: number;
  };
  observations: PositionObservation[];
  marks?: Array<{ number: number; elapsedMs: number }>;
  corridors?: Corridor[];
  radio?: { beacons: CalibratedBeacon[]; transitions: FloorTransition[] };
}
