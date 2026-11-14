import { MAX_REPLAY_MARKS, type PositionObservation, type ReplayFixture } from "./observations";

type Untimed<T> = T extends PositionObservation ? Omit<T, "receivedAtMs" | "timestampMs"> : never;
export type SensorReading = Untimed<PositionObservation>;
type Metadata = Pick<ReplayFixture, "fixtureId" | "venueId" | "mapVersionId" | "startedAt" | "seed" | "device">;

/** Starts only when the caller explicitly creates a recording. No device or storage dependency. */
export function startRecording(metadata: Metadata, monotonicNow: () => number, maxSamples = 100000) {
  if (!Number.isSafeInteger(maxSamples) || maxSamples < 1) throw new Error("Invalid recording size limit");
  const origin = monotonicNow();
  if (!Number.isFinite(origin)) throw new Error("Invalid recording clock");
  const observations: PositionObservation[] = [];
  const marks: NonNullable<ReplayFixture["marks"]> = [];
  let lastReceipt = 0;
  let finished: ReplayFixture | undefined;
  return {
    record(reading: SensorReading, capturedAt?: number) {
      if (finished || observations.length >= maxSamples) return false;
      const receivedAtMs = monotonicNow() - origin;
      const timestampMs = capturedAt === undefined ? receivedAtMs : capturedAt - origin;
      if (!Number.isFinite(receivedAtMs) || !Number.isFinite(timestampMs) ||
          receivedAtMs < lastReceipt || receivedAtMs > 86400000 ||
          timestampMs < 0 || timestampMs > receivedAtMs) return false;
      observations.push({ ...reading, receivedAtMs, timestampMs });
      lastReceipt = receivedAtMs;
      return true;
    },
    markCheckpoint() {
      if (finished || marks.length >= MAX_REPLAY_MARKS) return null;
      const elapsedMs = monotonicNow() - origin;
      if (!Number.isFinite(elapsedMs) || elapsedMs < lastReceipt || elapsedMs > 86400000 ||
          elapsedMs <= (marks.at(-1)?.elapsedMs ?? -1)) return null;
      const number = marks.length + 1;
      marks.push({ number, elapsedMs });
      lastReceipt = elapsedMs;
      return number;
    },
    stop(): ReplayFixture {
      if (finished) return finished;
      const elapsed = monotonicNow() - origin;
      const durationMs = Number.isFinite(elapsed) ? Math.min(86400000, Math.max(lastReceipt, elapsed)) : lastReceipt;
      finished = {
        ...metadata,
        schemaVersion: 1,
        durationMs,
        truth: { provenance: "unlabelled", checkpoints: [] },
        observations: observations.slice(),
        ...(marks.length ? { marks: marks.slice() } : {}),
      };
      return finished;
    },
  };
}
