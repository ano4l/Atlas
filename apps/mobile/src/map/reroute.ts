import type { MapPackage, PlatformApiClient, Route, RouteRequest } from "@atlas/api-client";
import { isPublicEdge, isStepFreeEdge, isWithinEdgeWindow, readEdgeWindow } from "./edge-availability";
import { authoredEdgePoints, edgePoints } from "./edge-geometry";
import { isUnavailable } from "./offline-venue";

type Node = MapPackage["graph"]["nodes"][number];

/** Find a legal, visibly separate branch for the fictional missed-turn scenario. */
export function findSimulatedDetour(
  pkg: MapPackage, route: Route, legIndex: number,
  position: { x: number; y: number }, stepFree: boolean, nowMs: number,
): { to: Node; polyline: Route["floors"][number]["polyline"]; validUntilMs: number | null } | null {
  const leg = route.floors[legIndex];
  const nodes = new Map(pkg.graph.nodes.map((node) => [node.id, node]));
  const distanceFromRoute = (node: Node) => Math.min(...leg.polyline.slice(1).map(([x, y], index) => {
    const [sx, sy] = leg.polyline[index];
    const dx = x - sx;
    const dy = y - sy;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared
      ? Math.max(0, Math.min(1, ((node.x - sx) * dx + (node.y - sy) * dy) / lengthSquared)) : 0;
    return Math.hypot(node.x - sx - dx * t, node.y - sy - dy * t);
  }), Math.hypot(node.x - leg.polyline[0][0], node.y - leg.polyline[0][1]));
  for (const edge of pkg.graph.edges) {
    if (!isPublicEdge(edge) || typeof edge.isOneWay !== "boolean" || (stepFree && !isStepFreeEdge(edge))) continue;
    const window = readEdgeWindow(edge);
    if (!window || !isWithinEdgeWindow(window, nowMs)) continue;
    const a = nodes.get(edge.fromNodeId);
    const b = nodes.get(edge.toNodeId);
    if (a?.floorId !== leg.floorId || b?.floorId !== leg.floorId) continue;
    for (const [from, to] of edge.isOneWay === false ? [[a, b], [b, a]] : [[a, b]]) {
      if (Math.hypot(from.x - position.x, from.y - position.y) > 0.75 ||
          distanceFromRoute(from) > 0.01 || distanceFromRoute(to) < 6) continue;
      const polyline = edge.geometry == null
        ? edgePoints(null, from, to) : authoredEdgePoints(edge.geometry, from, to);
      if (polyline) return { to, polyline, validUntilMs: window.validUntil };
    }
  }
  return null;
}

export async function requestReroute(
  client: Pick<PlatformApiClient, "calculateRoute">,
  planOffline: ((request: RouteRequest, nowMs: number) => Route | null) | null,
  venueId: string,
  request: RouteRequest,
  options: { offline: boolean; signal: AbortSignal; now: () => number },
): Promise<{ route: Route | null; offline: boolean; fallbackError?: unknown }> {
  if (options.signal.aborted) throw new Error("Reroute cancelled");
  if (!options.offline) {
    try {
      const route = await client.calculateRoute(venueId, request, options.signal);
      if (options.signal.aborted) throw new Error("Reroute cancelled");
      return { route, offline: false };
    } catch (error) {
      if (options.signal.aborted || !isUnavailable(error) || !planOffline) throw error;
      return { route: planOffline(request, options.now()), offline: true, fallbackError: error };
    }
  }
  return { route: planOffline?.(request, options.now()) ?? null, offline: true };
}
