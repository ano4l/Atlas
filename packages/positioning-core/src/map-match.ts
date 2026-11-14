import type { PositionEstimate } from "./index";

type Point = { x: number; y: number };

export interface Corridor {
  id: string;
  floorId: string;
  fromNodeId: string;
  toNodeId: string;
  geometry: readonly Point[];
  oneWay?: boolean;
}

export type CorridorMatch = {
  raw: PositionEstimate;
  position: PositionEstimate;
  corridorId: string | null;
  reason: "matched" | "unknown-floor" | "lost" | "off-graph" | "ambiguous";
};

type PreparedCorridor = Corridor & {
  length: number;
  segments: Array<{ start: Point; dx: number; dy: number; length: number; offset: number }>;
};
type Candidate = { corridor: PreparedCorridor; point: Point; distance: number; score: number; offset: number };

function prepare(corridor: Corridor): PreparedCorridor {
  const segments: PreparedCorridor["segments"] = [];
  let length = 0;
  for (let index = 1; index < corridor.geometry.length; index++) {
    const start = corridor.geometry[index - 1];
    const end = corridor.geometry[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segmentLength = Math.hypot(dx, dy);
    if (!Number.isFinite(segmentLength) || segmentLength === 0) continue;
    segments.push({ start, dx, dy, length: segmentLength, offset: length });
    length += segmentLength;
  }
  return { ...corridor, length, segments };
}

function project(raw: PositionEstimate, corridor: PreparedCorridor, previous?: Candidate): Candidate[] {
  return corridor.segments.map(({ start, dx, dy, length, offset }) => {
    const fraction = Math.max(0, Math.min(1, ((raw.x - start.x) * dx + (raw.y - start.y) * dy) / (length * length)));
    const point = { x: start.x + fraction * dx, y: start.y + fraction * dy };
    const distance = Math.hypot(raw.x - point.x, raw.y - point.y);
    const heading = raw.headingDegrees;
    const headingPenalty = heading === null || !Number.isFinite(heading) ? 0 :
      1 - Math.abs((Math.sin(heading * Math.PI / 180) * dx - Math.cos(heading * Math.PI / 180) * dy) / length);
    const score = distance + headingPenalty - (previous?.corridor.id === corridor.id ? 0.5 : 0);
    return { corridor, point, distance, score, offset: offset + fraction * length };
  });
}

function travelDistance(previous: Candidate, next: Candidate): number {
  const a = previous.corridor;
  const b = next.corridor;
  if (a.id === b.id) {
    const delta = next.offset - previous.offset;
    return a.oneWay && delta < -0.75 ? Infinity : Math.abs(delta);
  }
  const exits = [{ nodeId: a.toNodeId, distance: a.length - previous.offset }];
  if (!a.oneWay) exits.push({ nodeId: a.fromNodeId, distance: previous.offset });
  const entries = [{ nodeId: b.fromNodeId, distance: next.offset }];
  if (!b.oneWay) entries.push({ nodeId: b.toNodeId, distance: b.length - next.offset });
  let shortest = Infinity;
  for (const exit of exits) {
    for (const entry of entries) {
      if (exit.nodeId === entry.nodeId) shortest = Math.min(shortest, exit.distance + entry.distance);
    }
  }
  return shortest;
}

export function createCorridorMatcher(corridors: readonly Corridor[]) {
  const byFloor = new Map<string, PreparedCorridor[]>();
  for (const corridor of corridors) {
    const floor = byFloor.get(corridor.floorId) ?? [];
    floor.push(prepare(corridor));
    byFloor.set(corridor.floorId, floor);
  }
  let previous: Candidate | undefined;
  let previousTime = -Infinity;
  let latestTime = -Infinity;

  return {
    reset() {
      previous = undefined;
      previousTime = -Infinity;
      latestTime = -Infinity;
    },
    match(raw: PositionEstimate, elapsedMs: number): CorridorMatch {
      const unmapped = (reason: CorridorMatch["reason"]): CorridorMatch =>
        ({ raw, position: raw, corridorId: null, reason });
      if (!Number.isFinite(elapsedMs) || !Number.isFinite(raw.x) || !Number.isFinite(raw.y) ||
          !Number.isFinite(raw.horizontalAccuracyM) || raw.horizontalAccuracyM < 0) return unmapped("lost");
      if (elapsedMs < latestTime) return unmapped("lost");
      latestTime = elapsedMs;
      if (!raw.floorId || raw.confidence === "lost") {
        previous = undefined;
        previousTime = elapsedMs;
        return unmapped(raw.floorId ? "lost" : "unknown-floor");
      }

      const current = previous?.corridor.floorId === raw.floorId && elapsedMs - previousTime <= 4000 ? previous : undefined;
      const maxDistance = Math.min(4, Math.max(1.25, raw.horizontalAccuracyM));
      const candidates = (byFloor.get(raw.floorId) ?? []).flatMap((corridor) => project(raw, corridor, current))
        .filter((candidate) => candidate.distance <= maxDistance)
        .sort((a, b) => a.score - b.score);
      const best = candidates[0];
      const travelBudget = current ? maxDistance + (elapsedMs - previousTime) * 0.003 : Infinity;
      if (!best || (current && travelDistance(current, best) > travelBudget)) return unmapped("off-graph");
      if (candidates.slice(1).some((other) => other.score - best.score < 0.75 &&
          (Math.hypot(best.point.x - other.point.x, best.point.y - other.point.y) >= 0.75 ||
            (best.corridor.id === other.corridor.id && Math.abs(best.offset - other.offset) > 3)))) {
        return unmapped("ambiguous");
      }
      previous = best;
      previousTime = elapsedMs;
      return {
        raw,
        position: {
          ...raw,
          ...best.point,
          sourceContributions: [...new Set([...raw.sourceContributions, "map_match" as const])],
        },
        corridorId: best.corridor.id,
        reason: "matched",
      };
    },
  };
}
