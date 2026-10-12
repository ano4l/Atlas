import { atlasSandtonVenue } from "../fixtures";
import { MapPoint, NavigationStep, POIItem, RouteFloorSegment } from "./types";

export type DemoRoute = {
  segments: RouteFloorSegment[];
  steps: NavigationStep[];
  distanceM: number;
  walkTimeMin: number;
};
type Segment = { floor: number; a: MapPoint; b: MapPoint; cuts: MapPoint[] };
type Node = { floor: number; point: MapPoint; edges: Map<string, number> };
const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y);
const key = (floor: number, p: MapPoint) =>
  `${floor}:${p.x.toFixed(3)}:${p.y.toFixed(3)}`;
export const floorName = (level: number) =>
  atlasSandtonVenue.floors.find((f) => f.level === level)?.name ??
  `Floor ${level}`;

/** Local schematic routing only. Coordinates and distances are illustrative. */
export function buildDemoRoute(
  destination: POIItem,
  stepFree = false,
): DemoRoute | null {
  const segments: Segment[] = atlasSandtonVenue.floors.flatMap((floor) =>
    (floor.corridorPaths ?? []).flatMap((path) =>
      path
        .slice(1)
        .map((b, i) => ({
          floor: floor.level,
          a: path[i],
          b,
          cuts: [path[i], b],
        })),
    ),
  );
  const graph = new Map<string, Node>();
  const addNode = (floor: number, point: MapPoint) => {
    const id = key(floor, point);
    if (!graph.has(id)) graph.set(id, { floor, point, edges: new Map() });
    return id;
  };
  const connect = (a: string, b: string, cost: number) => {
    graph.get(a)!.edges.set(b, cost);
    graph.get(b)!.edges.set(a, cost);
  };
  // Split crossing corridors so routes follow the connected walkable network.
  for (let i = 0; i < segments.length; i++)
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i],
        b = segments[j];
      if (a.floor !== b.floor) continue;
      const dx = a.b.x - a.a.x,
        dy = a.b.y - a.a.y,
        ex = b.b.x - b.a.x,
        ey = b.b.y - b.a.y;
      const denominator = dx * ey - dy * ex;
      if (Math.abs(denominator) < 0.00001) continue;
      const t = ((b.a.x - a.a.x) * ey - (b.a.y - a.a.y) * ex) / denominator;
      const u = ((b.a.x - a.a.x) * dy - (b.a.y - a.a.y) * dx) / denominator;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const point = { x: a.a.x + t * dx, y: a.a.y + t * dy };
        a.cuts.push(point);
        b.cuts.push(point);
      }
    }
  const attach = (floor: number, point: MapPoint) => {
    let best:
      | { segment: Segment; point: MapPoint; distance: number }
      | undefined;
    for (const segment of segments.filter((s) => s.floor === floor)) {
      const dx = segment.b.x - segment.a.x,
        dy = segment.b.y - segment.a.y;
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared
        ? Math.max(
            0,
            Math.min(
              1,
              ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) /
                lengthSquared,
            ),
          )
        : 0;
      const projection = { x: segment.a.x + t * dx, y: segment.a.y + t * dy };
      const gap = distance(point, projection);
      if (!best || gap < best.distance)
        best = { segment, point: projection, distance: gap };
    }
    if (!best) return null;
    best.segment.cuts.push(best.point);
    const id = addNode(floor, point),
      corridorId = addNode(floor, best.point);
    connect(id, corridorId, best.distance);
    return id;
  };
  const startId = attach(
    atlasSandtonVenue.startFloorLevel,
    atlasSandtonVenue.start,
  );
  const endId = attach(destination.floorLevel, destination.point);
  // Both transition cores are part of the fixture; the preference changes the route.
  for (const kind of stepFree ? ["lift"] : ["lift", "escalator"]) {
    const cores = atlasSandtonVenue.floors.flatMap((f) =>
      f.facilities
        .filter((p) => p.kind === kind)
        .map((p) => ({ floor: f.level, point: p.point })),
    );
    for (let i = 1; i < cores.length; i++) {
      const a = attach(cores[i - 1].floor, cores[i - 1].point),
        b = attach(cores[i].floor, cores[i].point);
      if (a && b) connect(a, b, kind === "lift" ? 40 : 20);
    }
  }
  for (const segment of segments) {
    // Include collinear endpoints from overlapping paths as well as intersections.
    for (const other of segments.filter((s) => s.floor === segment.floor))
      for (const p of [other.a, other.b]) {
        if (
          Math.abs(
            distance(segment.a, p) +
              distance(p, segment.b) -
              distance(segment.a, segment.b),
          ) < 0.001
        )
          segment.cuts.push(p);
      }
    const sorted = segment.cuts.sort(
      (a, b) => distance(segment.a, a) - distance(segment.a, b),
    );
    sorted.forEach((p) => addNode(segment.floor, p));
    for (let i = 1; i < sorted.length; i++)
      connect(
        key(segment.floor, sorted[i - 1]),
        key(segment.floor, sorted[i]),
        distance(sorted[i - 1], sorted[i]),
      );
  }
  if (!startId || !endId) return null;
  const costs = new Map([[startId, 0]]),
    previous = new Map<string, string>(),
    open = new Set(graph.keys());
  while (open.size) {
    let next: string | undefined,
      cheapest = Infinity;
    for (const id of open)
      if ((costs.get(id) ?? Infinity) < cheapest) {
        next = id;
        cheapest = costs.get(id)!;
      }
    if (!next) break;
    open.delete(next);
    if (next === endId) break;
    for (const [neighbor, cost] of graph.get(next)!.edges)
      if (
        open.has(neighbor) &&
        cheapest + cost < (costs.get(neighbor) ?? Infinity)
      ) {
        costs.set(neighbor, cheapest + cost);
        previous.set(neighbor, next);
      }
  }
  if (!costs.has(endId)) return null;
  const path: Node[] = [];
  for (
    let cursor: string | undefined = endId;
    cursor;
    cursor = previous.get(cursor)
  )
    path.unshift(graph.get(cursor)!);
  const result: RouteFloorSegment[] = [];
  for (const node of path) {
    let segment = result[result.length - 1];
    if (!segment || segment.floorLevel !== node.floor) {
      if (segment) {
        const transition = atlasSandtonVenue.floors
          .find((f) => f.level === segment.floorLevel)!
          .facilities.find(
            (f) =>
              distance(f.point, segment.polyline[segment.polyline.length - 1]) <
                1 && ["lift", "escalator"].includes(f.kind),
          );
        segment.transitionAt = segment.polyline[segment.polyline.length - 1];
        segment.transitionType =
          transition?.kind === "lift" ? "lift" : "escalator";
        segment.transitionToLevel = node.floor;
      }
      segment = {
        floorId: atlasSandtonVenue.floors.find((f) => f.level === node.floor)!
          .id,
        floorLevel: node.floor,
        polyline: [],
      };
      result.push(segment);
    }
    if (
      !segment.polyline.length ||
      distance(segment.polyline[segment.polyline.length - 1], node.point) >
        0.001
    )
      segment.polyline.push(node.point);
  }
  const steps: NavigationStep[] = result.flatMap((segment) => {
    const points = segment.polyline;
    const travel = points
      .slice(1)
      .reduce((sum, p, i) => sum + distance(points[i], p), 0);
    const base: NavigationStep[] = [
      {
        id: `walk-${segment.floorLevel}`,
        instruction: `Follow the path on ${floorName(segment.floorLevel)}`,
        subInstruction: segment.transitionAt
          ? `Continue to the ${segment.transitionType}`
          : `Continue toward ${destination.name}`,
        distanceM: Math.round(travel * 0.5),
        icon: "straight",
        floorLevel: segment.floorLevel,
        floorName: floorName(segment.floorLevel),
        nodePoint: points[0],
      },
    ];
    if (segment.transitionAt)
      base.push({
        id: `change-${segment.floorLevel}`,
        instruction: `Take the ${segment.transitionType} to ${floorName(segment.transitionToLevel!)}`,
        subInstruction: stepFree ? "Step-free route" : "Change floors here",
        distanceM: 0,
        icon: segment.transitionType === "lift" ? "lift" : "escalator",
        floorLevel: segment.floorLevel,
        floorName: floorName(segment.floorLevel),
        nodePoint: segment.transitionAt,
      });
    return base;
  });
  steps.push({
    id: "arrive",
    instruction: `You’re at ${destination.name}`,
    subInstruction: destination.entranceInfo,
    distanceM: 0,
    icon: "arrive",
    floorLevel: destination.floorLevel,
    floorName: floorName(destination.floorLevel),
    nodePoint: destination.point,
  });
  const distanceM = Math.round((costs.get(endId) ?? 0) * 0.5);
  return {
    segments: result,
    steps,
    distanceM,
    walkTimeMin: Math.max(1, Math.ceil(distanceM / 70)),
  };
}
