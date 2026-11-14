import { isMapPackage, PlatformApiError, PlatformNetworkError } from "@atlas/api-client";
import type { MapPackage, Route, RouteRequest } from "@atlas/api-client";
import { buildGraph, findShortestRoute } from "@atlas/routing-core";
import { createConnectedVenue } from "./connected-venue";
import { isPublicEdge, isStepFreeEdge, isWithinEdgeWindow, readEdgeWindow } from "./edge-availability";
import { edgePoints } from "./edge-geometry";

const CACHE_VERSION = 1;
type Edge = MapPackage["graph"]["edges"][number];
type RoutingEdge = NonNullable<ReturnType<typeof routingEdge>>;

function routingEdge(edge: Edge) {
  const { baseCostM, isOneWay } = edge;
  const window = readEdgeWindow(edge);
  if (typeof baseCostM !== "number" || !Number.isFinite(baseCostM) || baseCostM <= 0 ||
      typeof isOneWay !== "boolean" || !window ||
      edge.validFrom === undefined || edge.validUntil === undefined ||
      !["open", "closed", "temporary_closed"].includes(edge.closureState)) return null;
  return {
    ...edge,
    directionality: isOneWay ? "forward" as const : "bidirectional" as const,
    distanceM: baseCostM,
    estimatedTimeS: Math.floor(baseCostM / 1.2),
    ...window,
  };
}

export function createOfflinePlanner(pkg: MapPackage) {
  const parsed = pkg.graph.edges.map(routingEdge);
  if (parsed.some((edge) => !edge) ||
      new Set(pkg.graph.edges.map((edge) => edge.id)).size !== parsed.length ||
      new Set(pkg.pois.map((poi) => poi.id)).size !== pkg.pois.length) return null;
  const nodes = new Map(pkg.graph.nodes.map((node) => [node.id, node]));
  const floors = new Set(pkg.floors.map((floor) => floor.id));
  if (nodes.size !== pkg.graph.nodes.length ||
      pkg.graph.nodes.some((node) => !floors.has(node.floorId)) ||
      pkg.graph.edges.some((edge) => !nodes.has(edge.fromNodeId) || !nodes.has(edge.toNodeId))) return null;
  const destinations = new Map(pkg.pois.map((poi) => [poi.id, poi]));
  const nodesByFloor = new Map<string, MapPackage["graph"]["nodes"]>();
  for (const node of pkg.graph.nodes) {
    const floorNodes = nodesByFloor.get(node.floorId);
    if (floorNodes) floorNodes.push(node);
    else nodesByFloor.set(node.floorId, [node]);
  }
  let openEdges: RoutingEdge[] | undefined;
  const sortedOpenEdges = () => openEdges ??= parsed.filter((edge): edge is RoutingEdge =>
    edge !== null && isPublicEdge(edge))
    .sort((a, b) => a.id < b.id ? -1 : a.id === b.id ? 0 : 1);
  const graphAt = (edges: RoutingEdge[]) => {
    if (edges.every((edge) => edge.validFrom === null && edge.validUntil === null)) {
      let graph: ReturnType<typeof buildGraph<RoutingEdge>> | undefined;
      return () => graph ??= buildGraph(pkg.graph.nodes, edges);
    }
    return (nowMs: number) => buildGraph(pkg.graph.nodes, edges.filter((edge) => isWithinEdgeWindow(edge, nowMs)));
  };
  let shortestGraph: ReturnType<typeof graphAt> | undefined;
  let stepFreeGraph: ReturnType<typeof graphAt> | undefined;
  return (request: RouteRequest, nowMs: number): Route | null => {
    if (request.mapVersionId !== pkg.mapVersion.id || !Number.isFinite(nowMs)) return null;
    const poi = destinations.get(request.destinationPoiId);
    if (!poi?.entryPointNodeId || poi.status === "closed") return null;
    const goal = nodes.get(poi.entryPointNodeId);
    if (!goal || goal.floorId !== poi.floorId) return null;
    if (!Number.isFinite(request.start.x) || !Number.isFinite(request.start.y)) return null;
    let start: (typeof pkg.graph.nodes)[number] | undefined;
    let bestDistance = Infinity;
    for (const node of nodesByFloor.get(request.start.floorId) ?? []) {
      const distance = Math.hypot(node.x - request.start.x, node.y - request.start.y);
      if (distance < bestDistance || (distance === bestDistance && (!start || node.id < start.id))) {
        start = node;
        bestDistance = distance;
      }
    }
    if (!start) return null;
    const graph = request.mode === "step_free"
      ? (stepFreeGraph ??= graphAt(sortedOpenEdges().filter(isStepFreeEdge)))(nowMs)
      : (shortestGraph ??= graphAt(sortedOpenEdges()))(nowMs);
    const path = findShortestRoute(graph, start.id, goal.id);
    if (!path) return null;

    const floors: Route["floors"] = [{ floorId: start.floorId, polyline: [[start.x, start.y]] }];
    const transitions: Route["transitions"] = [];
    let distance = 0;
    let validUntilMs = Infinity;
    for (const segment of path.segments) {
      if (segment.edge.validUntil !== null) validUntilMs = Math.min(validUntilMs, segment.edge.validUntil);
      const from = nodes.get(segment.fromNodeId)!;
      const to = nodes.get(segment.toNodeId)!;
      if (from.floorId !== to.floorId) {
        distance += Math.hypot(to.x - from.x, to.y - from.y);
        transitions.push({ fromFloorId: from.floorId, toFloorId: to.floorId, transitionType: segment.edge.edgeType });
        floors.push({ floorId: to.floorId, polyline: [[to.x, to.y]] });
        continue;
      }
      const points = edgePoints(segment.edge.geometry, from, to);
      const { polyline } = floors[floors.length - 1];
      for (let index = 1; index < points.length; index += 1) {
        const [x, y] = points[index];
        const [previousX, previousY] = points[index - 1];
        distance += Math.hypot(x - previousX, y - previousY);
        polyline.push(points[index]);
      }
    }
    return {
      mapVersionId: pkg.mapVersion.id,
      distanceM: Math.round(distance * 10) / 10,
      estimatedTimeS: Math.floor(distance / 1.2),
      ...(Number.isFinite(validUntilMs) ? { validUntilMs } : {}),
      floors,
      transitions,
    };
  };
}

function searchTerms(value: unknown): string[] {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(value)
    ? value.filter((term): term is string => typeof term === "string").map((term) => term.toLowerCase())
    : [];
}

export function searchCachedVenue(pkg: MapPackage, query: string): string[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return pkg.pois.filter((poi) => poi.status !== "closed").map((poi) => {
    const name = poi.name.toLowerCase();
    const aliases = searchTerms(poi.aliases);
    const keywords = searchTerms(poi.searchKeywords);
    const score = (name === term ? 100 : aliases.includes(term) ? 90 : 0) +
      (name.startsWith(term) ? 50 : name.includes(term) ? 25 : 0) +
      (aliases.some((alias) => alias.startsWith(term)) ? 30 : 0) +
      (keywords.some((keyword) => keyword.startsWith(term)) ? 20 : 0) -
      (poi.status === "temporarily_closed" ? 10 : 0);
    return { poi, score };
  }).filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || (a.poi.name < b.poi.name ? -1 : a.poi.name === b.poi.name ? 0 : 1))
    .map(({ poi }) => poi.id);
}

export function encodeVenueSnapshot(pkg: MapPackage, syncedAtMs: number): string {
  return JSON.stringify({ version: CACHE_VERSION, syncedAtMs, pkg });
}

export function readVenueSnapshot(raw: string | null, slug: string, nowMs: number) {
  if (!raw) return null;
  try {
    const snapshot = JSON.parse(raw);
    if (snapshot?.version !== CACHE_VERSION || !Number.isFinite(snapshot.syncedAtMs) ||
        snapshot.syncedAtMs < 0 || snapshot.syncedAtMs > nowMs ||
        !isMapPackage(snapshot.pkg) || snapshot.pkg.venue.slug !== slug ||
        !createOfflinePlanner(snapshot.pkg)) return null;
    return {
      pkg: snapshot.pkg,
      syncedAtMs: snapshot.syncedAtMs as number,
      venue: createConnectedVenue(snapshot.pkg, nowMs),
    };
  } catch {
    return null;
  }
}

export function isUnavailable(error: unknown) {
  return error instanceof PlatformNetworkError ||
    (error instanceof PlatformApiError && (error.status === 408 || error.status >= 500));
}
