import { createStepDetector, type PositionEstimate } from "./index";
import type { PositioningProvider, PositioningSession } from "./observations";

type Fix = { floorId: string; x: number; y: number; accuracyM: number; timestampMs: number };
type Heading = { degrees: number; timestampMs: number; accuracyDegrees: number };

export function createWalkingProvider(
  session: PositioningSession,
  options: { stepLengthM: number; useMotion: boolean } = { stepLengthM: 0.7, useMotion: true },
): PositioningProvider {
  if (!Number.isFinite(options.stepLengthM) || options.stepLengthM <= 0 || options.stepLengthM > 2) {
    throw new Error("Step length must be within (0, 2] metres");
  }
  const epoch = Date.parse(session.startedAt);
  if (!Number.isFinite(epoch)) throw new Error("Invalid positioning session start");
  let detect = createStepDetector();
  let fix: Fix | undefined;
  let heading: Heading | undefined;
  let previousMotionHeading: Heading | undefined;
  let steps = 0;
  let untrackedSteps = 0;
  let trackedSteps = 0;
  let x = 0;
  let y = 0;

  return {
    algorithm: options.useMotion ? "step-and-heading-v1" : "last-fix-v1",
    observe(observation) {
      switch (observation.kind) {
        case "fix":
          fix = observation;
          ({ x, y } = fix);
          trackedSteps = 0;
          untrackedSteps = 0;
          detect = createStepDetector();
          previousMotionHeading = undefined;
          break;
        case "heading":
          heading = observation;
          break;
        case "motion": {
          const step = detect(observation);
          const atPeak = previousMotionHeading;
          previousMotionHeading = heading && heading.timestampMs <= observation.timestampMs ? heading : undefined;
          if (step === null) break;
          steps++;
          if (!fix || step < fix.timestampMs) break;
          if (!options.useMotion || !atPeak || step - atPeak.timestampMs > 2500 || atPeak.accuracyDegrees > 35) {
            untrackedSteps++;
            break;
          }
          const radians = atPeak.degrees * Math.PI / 180;
          x += Math.sin(radians) * options.stepLengthM;
          y -= Math.cos(radians) * options.stepLengthM;
          trackedSteps++;
          break;
        }
      }
    },
    estimate(elapsedMs): PositionEstimate | null {
      if (!fix || elapsedMs < fix.timestampMs) return null;
      const ageSeconds = (elapsedMs - fix.timestampMs) / 1000;
      const accuracy = fix.accuracyM + trackedSteps * 0.12 + untrackedSteps * options.stepLengthM + ageSeconds * 0.04;
      const score = Math.max(0, 1 - accuracy / 12);
      const confidence = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : score >= 0.2 ? "low" : "lost";
      const recentHeading = heading && elapsedMs >= heading.timestampMs &&
        elapsedMs - heading.timestampMs <= 2500 && heading.accuracyDegrees <= 35
        ? heading.degrees : null;
      return {
        venueId: session.venueId,
        floorId: fix.floorId,
        x,
        y,
        headingDegrees: recentHeading,
        speedMps: null,
        horizontalAccuracyM: accuracy,
        confidence,
        confidenceScore: score,
        sourceContributions: trackedSteps ? ["manual", "pdr"] : ["manual"],
        timestamp: new Date(epoch + elapsedMs).toISOString(),
      };
    },
    stepCount: () => steps,
  };
}
