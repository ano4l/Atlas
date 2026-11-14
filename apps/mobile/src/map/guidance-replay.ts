import type { PositionEstimate } from "@atlas/positioning-core";
import type { Route } from "@atlas/api-client";

const SPEED_MPS = 2;

export function createWalkSample(polyline: Route["floors"][number]["polyline"]) {
  let total = 0;
  const edges = polyline.slice(1).flatMap((end, index) => {
    const start = polyline[index];
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    if (!length) return [];
    const offset = total;
    total += length;
    return [{ start, end, length, offset }];
  });
  return (elapsedMs: number) => {
    const distance = elapsedMs * (SPEED_MPS / 1000);
    const edge = edges.find((item) => distance < item.offset + item.length);
    if (!edge) {
      const [x, y] = polyline[polyline.length - 1];
      return { x, y, complete: true };
    }
    const ratio = Math.max(0, (distance - edge.offset) / edge.length);
    return {
      x: edge.start[0] + (edge.end[0] - edge.start[0]) * ratio,
      y: edge.start[1] + (edge.end[1] - edge.start[1]) * ratio,
      complete: false,
    };
  };
}

/** Prepares synthetic location samples for the fictional route walkthrough. */
export function createRouteReplay(route: Route, venueId: string) {
  const legs = route.floors.map((leg) => createWalkSample(leg.polyline));

  return (legIndex: number, legElapsedMs: number, elapsedMs: number): PositionEstimate => {
    const { x, y } = legs[legIndex](legElapsedMs);
    return {
      venueId, floorId: route.floors[legIndex].floorId, x, y,
      headingDegrees: null, speedMps: SPEED_MPS, horizontalAccuracyM: 0.5,
      confidence: "high", confidenceScore: 0.95, sourceContributions: [],
      timestamp: new Date(elapsedMs).toISOString(),
    };
  };
}
