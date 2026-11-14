import type { PositionEstimate } from "./index";

type Point = readonly [number, number];
type Leg = { floorId: string; polyline: readonly Point[] };
export type RouteProgress = {
  status: "following" | "confirm-floor" | "uncertain" | "off-route" | "arrived";
  legIndex: number;
  remainingM: number;
  nextFloorId?: string;
  nextTurn?: { direction: "left" | "right" | "around"; distanceM: number };
};

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const DISTINCT_ROUTE_OFFSETS_M = 5;

function prepare(leg: Leg) {
  const edges: Array<{ start: Point; end: Point; length: number; offset: number }> = [];
  let length = 0;
  for (let i = 1; i < leg.polyline.length; i++) {
    const start = leg.polyline[i - 1];
    const end = leg.polyline[i];
    const segmentLength = distance(start, end);
    if (!segmentLength) continue;
    edges.push({ start, end, length: segmentLength, offset: length });
    length += segmentLength;
  }
  const turns: Array<{ direction: "left" | "right" | "around"; offset: number }> = [];
  for (let i = 1; i < edges.length; i++) {
    const a = edges[i - 1];
    const b = edges[i];
    const ax = a.end[0] - a.start[0];
    const ay = a.end[1] - a.start[1];
    const bx = b.end[0] - b.start[0];
    const by = b.end[1] - b.start[1];
    // Local Y increases downwards, so a positive cross product is a right turn.
    const angle = Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
    if (Math.abs(angle) >= Math.PI / 6) {
      turns.push({ direction: Math.abs(angle) >= Math.PI * 0.85 ? "around" : angle > 0 ? "right" : "left", offset: b.offset });
    }
  }
  return { ...leg, edges, turns, length, end: leg.polyline[leg.polyline.length - 1] };
}

export function createRouteProgress(venueId: string, route: readonly Leg[]) {
  if (!route.length || route.some((leg) => !leg.floorId || !leg.polyline.length ||
      leg.polyline.some((point) => !point.every(Number.isFinite)))) {
    throw new Error("Guidance requires finite route coordinates and a floor for each leg");
  }
  const legs = route.map(prepare);
  let index = 0;
  let along = 0;
  let lastSample = -Infinity;
  let lastOnRoute = -Infinity;
  let outsideSince: number | undefined;
  let finishSince: number | undefined;
  let status: RouteProgress["status"] = "uncertain";

  function snapshot(): RouteProgress {
    const turn = status === "following" ? legs[index].turns.find((item) => item.offset > along + 0.2) : undefined;
    return {
      status,
      legIndex: index,
      remainingM: Math.max(0, legs[index].length - along) +
        legs.slice(index + 1).reduce((total, leg) => total + leg.length, 0),
      ...(status === "confirm-floor" ? { nextFloorId: legs[index + 1].floorId } : {}),
      ...(turn ? { nextTurn: { direction: turn.direction, distanceM: turn.offset - along } } : {}),
    };
  }

  return {
    update(estimate: PositionEstimate | null, elapsedMs: number): RouteProgress {
      if (!Number.isFinite(elapsedMs) || elapsedMs <= lastSample || status === "arrived") return snapshot();
      if (elapsedMs - lastSample > 1500) {
        finishSince = undefined;
        outsideSince = undefined;
      }
      lastSample = elapsedMs;
      const leg = legs[index];
      // Keep the prompt available when the first estimate on the next floor
      // arrives before the user confirms the transition.
      if (status === "confirm-floor" && estimate?.venueId === venueId &&
          estimate.floorId === legs[index + 1]?.floorId) return snapshot();
      if (!estimate || estimate.venueId !== venueId || estimate.floorId !== leg.floorId ||
          ![estimate.x, estimate.y, estimate.horizontalAccuracyM].every(Number.isFinite) ||
          estimate.horizontalAccuracyM < 0 || estimate.horizontalAccuracyM > 5 ||
          estimate.confidence === "lost" || estimate.confidence === "low") {
        outsideSince = undefined;
        finishSince = undefined;
        status = "uncertain";
        return snapshot();
      }

      const point: Point = [estimate.x, estimate.y];
      const tolerance = Math.min(5, Math.max(2, estimate.horizontalAccuracyM));
      const travelBudget = Number.isFinite(lastOnRoute)
        ? Math.min(12, (elapsedMs - lastOnRoute) * 0.003) + 2 : 5;
      const projections = leg.edges.flatMap((edge) => {
        const dx = edge.end[0] - edge.start[0];
        const dy = edge.end[1] - edge.start[1];
        const fraction = Math.max(0, Math.min(1, (
          (point[0] - edge.start[0]) * dx + (point[1] - edge.start[1]) * dy
        ) / (edge.length * edge.length)));
        const offset = edge.offset + edge.length * fraction;
        const error = distance(point, [edge.start[0] + dx * fraction, edge.start[1] + dy * fraction]);
        return error <= tolerance ? [{ offset, error }] : [];
      }).sort((a, b) => a.error - b.error || Math.abs(a.offset - along) - Math.abs(b.offset - along));
      const nearest = projections[0];
      // Two similarly close matches far apart along the route cannot establish
      // which corridor the walker is in, even when one matches recent progress.
      if (nearest && projections.some((candidate) =>
        Math.abs(candidate.offset - nearest.offset) > DISTINCT_ROUTE_OFFSETS_M &&
        candidate.error - nearest.error <= estimate.horizontalAccuracyM)) {
        outsideSince = undefined;
        finishSince = undefined;
        status = "uncertain";
        return snapshot();
      }
      const projection = nearest && Math.abs(nearest.offset - along) <= travelBudget ? nearest : undefined;
      if (!projection && (leg.edges.length || distance(point, leg.end) > tolerance)) {
        outsideSince ??= elapsedMs;
        finishSince = undefined;
        status = elapsedMs - outsideSince >= 2500 ? "off-route" : "uncertain";
        return snapshot();
      }
      outsideSince = undefined;
      lastOnRoute = elapsedMs;
      along = projection?.offset ?? 0;
      const atEnd = leg.length - along <= 1.5 && distance(point, leg.end) <= 1.5 &&
        estimate.horizontalAccuracyM <= 2;
      if (!atEnd) {
        finishSince = undefined;
        status = "following";
      } else {
        finishSince ??= elapsedMs;
        status = elapsedMs - finishSince < 1000 ? "following" :
          index + 1 < legs.length ? "confirm-floor" : "arrived";
      }
      if (status === "arrived") along = leg.length;
      return snapshot();
    },
    confirmFloor(floorId: string): RouteProgress {
      if (status !== "confirm-floor" || floorId !== legs[index + 1]?.floorId) return snapshot();
      index++;
      along = 0;
      lastOnRoute = -Infinity;
      finishSince = undefined;
      status = "uncertain";
      return snapshot();
    },
  };
}
