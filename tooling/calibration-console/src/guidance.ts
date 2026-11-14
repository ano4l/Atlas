import { createRouteProgress, type PositionEstimate, type ReplayFixture, type RouteProgress } from "@atlas/positioning-core";

type Floor = { floorId: string; polyline: [number, number][] };
type Confirmation = { elapsedMs: number; floorId: string };
type Plan = { floors: Floor[]; confirmations: Confirmation[] };
type Sample = {
  elapsedMs: number;
  estimate: PositionEstimate | null;
  positionObservationAtMs: number | null;
  correction?: { capturedAtMs: number; floorId: string };
};
const MAX_POSITION_AGE_MS = 1500;

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseGuidancePlan(value: unknown, fixture: ReplayFixture): Plan {
  if (!object(value) || value.venueId !== fixture.venueId || value.mapVersionId !== fixture.mapVersionId ||
      !Array.isArray(value.floors) || value.floors.length === 0 || value.floors.length > 100) {
    throw new Error("Guidance plan must match the replay venue and map version and include route floors");
  }
  const floors = value.floors.map((floor) => {
    if (!object(floor) || typeof floor.floorId !== "string" || !floor.floorId.trim() ||
        !Array.isArray(floor.polyline) || !floor.polyline.length ||
        !floor.polyline.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))) {
      throw new Error("Invalid guidance route floor or coordinates");
    }
    return { floorId: floor.floorId, polyline: floor.polyline as Floor["polyline"] };
  });
  const confirmations: Confirmation[] = [];
  if (value.confirmations !== undefined) {
    if (!Array.isArray(value.confirmations) || value.confirmations.length > 100) throw new Error("Invalid floor confirmations");
    for (const confirmation of value.confirmations) {
      if (!object(confirmation) || typeof confirmation.elapsedMs !== "number" || !Number.isFinite(confirmation.elapsedMs) ||
          confirmation.elapsedMs < 0 || confirmation.elapsedMs > fixture.durationMs ||
          confirmation.elapsedMs <= (confirmations.at(-1)?.elapsedMs ?? -1) ||
          typeof confirmation.floorId !== "string" || !confirmation.floorId.trim()) {
        throw new Error("Floor confirmations must have a floor ID and increasing elapsed times");
      }
      confirmations.push({ elapsedMs: confirmation.elapsedMs, floorId: confirmation.floorId });
    }
  }
  return { floors, confirmations };
}

export function replayGuidance(venueId: string, plan: Plan, samples: readonly Sample[]) {
  const tracker = createRouteProgress(venueId, plan.floors);
  const transitions: Array<{ elapsedMs: number; status: RouteProgress["status"]; legIndex: number }> = [];
  const turnPrompts: Array<{ elapsedMs: number; legIndex: number; turn: NonNullable<RouteProgress["nextTurn"]> }> = [];
  const confirmations: Array<Confirmation & { accepted: boolean }> = [];
  const corrections: Array<{
    elapsedMs: number;
    capturedAtMs: number;
    floorId: string;
    previousStatus: RouteProgress["status"];
    recoveredAfterMs: number | null;
  }> = [];
  let pendingRecovery: typeof corrections[number] | undefined;
  let state = tracker.update(null, -1);
  let confirmationIndex = 0;
  let staleSamples = 0;
  let lastPositionObservation = -Infinity;
  function record(next: RouteProgress, elapsedMs: number) {
    if (!transitions.length || next.status !== state.status || next.legIndex !== state.legIndex) {
      transitions.push({ elapsedMs, status: next.status, legIndex: next.legIndex });
    }
    if (next.nextTurn && (next.legIndex !== state.legIndex ||
        !state.nextTurn || next.nextTurn.direction !== state.nextTurn.direction ||
        Math.abs((next.remainingM - next.nextTurn.distanceM) -
          (state.remainingM - state.nextTurn.distanceM)) > 0.01)) {
      turnPrompts.push({ elapsedMs, legIndex: next.legIndex, turn: next.nextTurn });
    }
    state = next;
  }
  function confirmThrough(elapsedMs: number) {
    while (plan.confirmations[confirmationIndex]?.elapsedMs <= elapsedMs) {
      const action = plan.confirmations[confirmationIndex++];
      const next = tracker.confirmFloor(action.floorId);
      confirmations.push({ ...action, accepted: next.legIndex > state.legIndex });
      record(next, action.elapsedMs);
    }
  }
  for (const sample of samples) {
    confirmThrough(sample.elapsedMs);
    if (sample.correction && state.status !== "arrived") {
      const entry = { ...sample.correction, elapsedMs: sample.elapsedMs, previousStatus: state.status, recoveredAfterMs: null };
      corrections.push(entry);
      pendingRecovery = state.status === "uncertain" || state.status === "off-route" ? entry : undefined;
    }
    const observationAtMs = sample.correction?.capturedAtMs ?? sample.positionObservationAtMs;
    const age = sample.elapsedMs - (observationAtMs ?? -Infinity);
    const stale = sample.estimate !== null && (age < 0 || age > MAX_POSITION_AGE_MS);
    if (stale) staleSamples++;
    if (sample.estimate && !stale) {
      if (!sample.correction && observationAtMs! <= lastPositionObservation) continue;
      lastPositionObservation = Math.max(lastPositionObservation, sample.positionObservationAtMs ?? -Infinity);
    }
    record(tracker.update(stale ? null : sample.estimate, sample.elapsedMs), sample.elapsedMs);
    if (!stale && pendingRecovery && sample.estimate?.floorId === pendingRecovery.floorId &&
        (state.status === "following" || state.status === "confirm-floor" || state.status === "arrived")) {
      pendingRecovery.recoveredAfterMs = sample.elapsedMs - pendingRecovery.elapsedMs;
      pendingRecovery = undefined;
    }
  }
  confirmThrough(Infinity);
  return {
    status: state.status,
    remainingM: Number(state.remainingM.toFixed(2)),
    arrivalMs: transitions.find((entry) => entry.status === "arrived")?.elapsedMs ?? null,
    transitions,
    turnPrompts,
    confirmations,
    corrections,
    staleSamples,
  };
}
