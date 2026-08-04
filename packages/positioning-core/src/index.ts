// Pure positioning algorithms. No React Native / UI imports allowed here
// (techspec.md §4.1). Implemented incrementally per Phase 2 (techspec.md §17).

export type ConfidenceLevel = "high" | "medium" | "low" | "lost";

export type PositionSource = "manual" | "pdr" | "ble" | "visual" | "map_match" | "barometer";

export interface PositionEstimate {
  venueId: string;
  floorId: string | null;
  x: number;
  y: number;
  headingDegrees: number | null;
  speedMps: number | null;
  horizontalAccuracyM: number;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0..1, internal/diagnostic
  sourceContributions: PositionSource[];
  timestamp: string;
}

export interface MotionSample {
  timestampMs: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
}

/**
 * Step detector placeholder. Must remain deterministic against recorded
 * sensor logs (techspec.md §6.4). Real implementation lands in Phase 2.
 */
export interface StepDetectorConfig {
  sampleRateHz: number;
  minPeakAmplitude: number;
  minStepIntervalMs: number;
  maxStepIntervalMs: number;
}

export const DEFAULT_STEP_DETECTOR_CONFIG: StepDetectorConfig = {
  sampleRateHz: 25,
  minPeakAmplitude: 1.2,
  minStepIntervalMs: 250,
  maxStepIntervalMs: 1200,
};

export function detectSteps(_samples: MotionSample[], _config: StepDetectorConfig = DEFAULT_STEP_DETECTOR_CONFIG): number[] {
  // TODO(Phase 2): implement peak detection with amplitude/periodicity scoring.
  return [];
}

export * from "./ble";
export * from "./fingerprint";
export * from "./visual";
