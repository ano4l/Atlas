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

/** Threshold in m/s² above gravity and the supported interval between peaks. */
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

export function createStepDetector(config: StepDetectorConfig = DEFAULT_STEP_DETECTOR_CONFIG) {
  let before: { time: number; amplitude: number } | undefined;
  let peak: typeof before;
  let lastStep = -Infinity;
  return (sample: MotionSample): number | null => {
    const time = sample.timestampMs;
    const amplitude = Math.hypot(sample.accelerationX, sample.accelerationY, sample.accelerationZ) - 9.80665;
    if (!Number.isFinite(time) || !Number.isFinite(amplitude) || (peak && time <= peak.time)) return null;
    if (peak && time - peak.time > Math.min(config.maxStepIntervalMs, 4000 / config.sampleRateHz)) {
      before = undefined;
      peak = undefined;
    }
    const step = before && peak &&
      peak.amplitude >= config.minPeakAmplitude &&
      peak.amplitude > before.amplitude &&
      peak.amplitude >= amplitude &&
      peak.time - lastStep >= config.minStepIntervalMs ? peak.time : null;
    before = peak;
    peak = { time, amplitude };
    if (step !== null) lastStep = step;
    return step;
  };
}

export function detectSteps(samples: MotionSample[], config = DEFAULT_STEP_DETECTOR_CONFIG): number[] {
  const detect = createStepDetector(config);
  const steps: number[] = [];
  for (const sample of samples) {
    const step = detect(sample);
    if (step !== null) steps.push(step);
  }
  return steps;
}

export * from "./ble";
export * from "./fingerprint";
export * from "./visual";
export * from "./observations";
export * from "./dead-reckoning";
export * from "./recorder";
export * from "./map-match";
export * from "./radio-positioning";
export * from "./route-progress";
