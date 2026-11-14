import type { MapPackage, Route } from "@atlas/api-client";
import { isPublicEdge, isStepFreeEdge, isWithinEdgeWindow, readEdgeWindow } from "./edge-availability";
import { edgePoints } from "./edge-geometry";
import type { IndoorFloor, MapPoint, POIItem, RouteFloorSegment } from "./types";

const DISPLAY_UNITS_PER_METRE = 2;
type Bounds = [number, number, number, number];
type Node = MapPackage["graph"]["nodes"][number];
type Edge = MapPackage["graph"]["edges"][number];

function sameCoordinate(point: readonly number[], node: Node) {
  return Math.hypot(point[0] - node.x, point[1] - node.y) < 0.000001;
}

function decodeJson(value: unknown): unknown {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function readBounds(input: MapPackage["floors"][number]["localBounds"]): Bounds {
  const bounds = decodeJson(input);
  if (!Array.isArray(bounds) || bounds.length !== 4 ||
      !bounds.every((value) => typeof value === "number" && Number.isFinite(value)) ||
      bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) {
    throw new Error("Invalid floor bounds");
  }
  return [bounds[0], bounds[1], bounds[2], bounds[3]];
}

function toMapPoint(bounds: Bounds, x: number, y: number): MapPoint {
  return { x: (x - bounds[0]) * DISPLAY_UNITS_PER_METRE, y: (y - bounds[1]) * DISPLAY_UNITS_PER_METRE };
}

function rectangle(left: number, top: number, right: number, bottom: number): MapPoint[] {
  return [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
}

export function createConnectedVenue(pkg: MapPackage, nowMs = Date.now()) {
  if (pkg.mapVersion.status.toLowerCase() !== "published") throw new Error("Map is unpublished");
  const venueName = pkg.venue.displayName ?? pkg.venue.name;
  const nodes = new Map(pkg.graph.nodes.map((node) => [node.id, node]));
  const floorsById = new Map(pkg.floors.map((floor) => [floor.id, {
    ...floor, bounds: readBounds(floor.localBounds),
  }]));
  if (floorsById.size !== pkg.floors.length || nodes.size !== pkg.graph.nodes.length ||
      new Set(pkg.floors.map((floor) => floor.ordinal)).size !== pkg.floors.length) {
    throw new Error("Duplicate floor or node identity");
  }
  if (pkg.graph.nodes.some((node) => !floorsById.has(node.floorId)) ||
      pkg.graph.edges.some((edge) => !nodes.has(edge.fromNodeId) || !nodes.has(edge.toNodeId))) {
    throw new Error("Invalid graph references");
  }
  if (new Set(pkg.graph.edges.map((edge) => edge.id)).size !== pkg.graph.edges.length ||
      new Set(pkg.pois.map((poi) => poi.id)).size !== pkg.pois.length) {
    throw new Error("Duplicate edge or destination identity");
  }

  const places: POIItem[] = pkg.pois.flatMap((poi) => {
    if (!poi.entryPointNodeId || poi.status === "closed") return [];
    const entry = nodes.get(poi.entryPointNodeId);
    const floor = floorsById.get(poi.floorId);
    if (!floor || !entry || entry.floorId !== floor.id) throw new Error("Invalid destination entrance");
    return [{
      id: poi.id,
      name: poi.name,
      category: poi.subcategory ?? "Place",
      floorName: floor.name,
      floorLevel: floor.ordinal,
      point: toMapPoint(floor.bounds, entry.x, entry.y),
      demo: true,
      distanceM: 0,
      walkTimeMin: 0,
      openingStatus: poi.status === "open" ? "Open" : "Temporarily closed",
      entranceInfo: floor.name,
    }];
  });

  const walkableEdges = pkg.graph.edges.flatMap((edge) => {
    const window = readEdgeWindow(edge);
    return window && isPublicEdge(edge) ? [{ edge, window }] : [];
  });
  const transitionsByFloor = new Map<string, Array<{ edge: Edge; from: Node; to: Node }>>();
  function registerTransition(edge: Edge, from: Node, to: Node) {
    const transitions = transitionsByFloor.get(from.floorId);
    const transition = { edge, from, to };
    if (transitions) transitions.push(transition);
    else transitionsByFloor.set(from.floorId, [transition]);
  }
  for (const edge of pkg.graph.edges) {
    const from = nodes.get(edge.fromNodeId)!;
    const to = nodes.get(edge.toNodeId)!;
    if (from.floorId === to.floorId || edge.isRestricted) continue;
    registerTransition(edge, from, to);
    if (edge.isOneWay !== true) registerTransition(edge, to, from);
  }
  const orderedFloors = [...floorsById.values()].sort((a, b) => a.ordinal - b.ordinal);
  function floorsAt(time: number): IndoorFloor[] {
    const visibleEdges = walkableEdges.filter(({ window }) => isWithinEdgeWindow(window, time));
    return orderedFloors.map((floor) => {
      const project = (x: number, y: number) => toMapPoint(floor.bounds, x, y);
      const [left, top, right, bottom] = floor.bounds;
      const width = (right - left) * DISPLAY_UNITS_PER_METRE;
      const height = (bottom - top) * DISPLAY_UNITS_PER_METRE;
      const walkways: MapPoint[][] = [];
      const facilities = new Map<string, IndoorFloor["facilities"][number]>();
      for (const { edge } of visibleEdges) {
        const from = nodes.get(edge.fromNodeId)!;
        const to = nodes.get(edge.toNodeId)!;
        if (from.floorId === floor.id && to.floorId === floor.id) {
          walkways.push(edgePoints(edge.geometry, from, to).map(([x, y]) => project(x, y)));
        } else if (edge.edgeType === "lift" || edge.edgeType === "escalator") {
          const local = from.floorId === floor.id ? from : to;
          if (local.floorId === floor.id) facilities.set(local.id, {
            id: local.id,
            kind: edge.edgeType,
            point: project(local.x, local.y),
          });
        }
      }
      return {
        id: floor.id,
        level: floor.ordinal,
        name: floor.name,
        shortLabel: floor.publicLabel ?? String(floor.ordinal),
        bounds: { width, height },
        plate: rectangle(0, 0, width, height),
        concourses: [],
        walkways,
        rooms: [],
        labels: [],
        facilities: [...facilities.values()],
      };
    });
  }

  const destinationEntrances = new Set(pkg.pois.map((poi) => poi.entryPointNodeId));
  const starts = pkg.graph.nodes.flatMap((node) => {
    const floor = floorsById.get(node.floorId);
    if (!floor || node.nodeType !== "entrance" || destinationEntrances.has(node.id)) return [];
    return [{
      id: node.id,
      floorLevel: floor.ordinal,
      floorName: floor.name,
      point: toMapPoint(floor.bounds, node.x, node.y),
      coordinates: { floorId: floor.id, x: node.x, y: node.y },
    }];
  }).sort((a, b) => a.floorLevel - b.floorLevel || a.coordinates.x - b.coordinates.x);
  if (!starts.length) throw new Error("No starting entrances");

  return {
    venueId: pkg.venue.id,
    venueName,
    mapVersionId: pkg.mapVersion.id,
    floors: floorsAt(nowMs),
    floorsAt,
    places,
    starts,
    projectPosition(floorId: string, x: number, y: number) {
      const floor = floorsById.get(floorId);
      return floor ? { point: toMapPoint(floor.bounds, x, y), level: floor.ordinal } : null;
    },
    routeSegments(
      route: Route, start: MapPoint, startFloorId: string, destination: POIItem, stepFree = false,
    ): RouteFloorSegment[] {
      if (route.mapVersionId !== pkg.mapVersion.id || route.floors[0]?.floorId !== startFloorId) {
        throw new Error("Route does not match the loaded map and start");
      }
      if (route.transitions.length !== route.floors.length - 1) {
        throw new Error("Route must have one transition per floor change");
      }
      const segments = route.floors.map((segment, index) => {
        const floor = floorsById.get(segment.floorId);
        if (!floor) throw new Error("Route references an unknown floor");
        const polyline = segment.polyline.map(([x, y]) => toMapPoint(floor.bounds, x, y));
        const transition = route.transitions[index];
        const next = route.floors[index + 1];
        if (next) {
          const fromPoint = segment.polyline[segment.polyline.length - 1];
          const toPoint = next.polyline[0];
          const connection = transitionsByFloor.get(floor.id)?.some(({ edge, from, to }) =>
            to.floorId === next.floorId && edge.edgeType === transition?.transitionType &&
            sameCoordinate(fromPoint, from) && sameCoordinate(toPoint, to) &&
            (!stepFree || isStepFreeEdge(edge)));
          if (transition?.fromFloorId !== floor.id || transition.toFloorId !== next.floorId || !connection) {
            throw new Error("Route transition does not match a mapped connection");
          }
        }
        return { floorId: floor.id, floorLevel: floor.ordinal, polyline };
      });
      const firstPoint = segments[0].polyline[0];
      const lastSegment = segments[segments.length - 1];
      const lastPoint = lastSegment.polyline[lastSegment.polyline.length - 1];
      if (!samePoint(firstPoint, start) || lastSegment.floorLevel !== destination.floorLevel ||
          !samePoint(lastPoint, destination.point)) {
        throw new Error("Route endpoints do not match the selected places");
      }
      return segments;
    },
  };
}

function samePoint(a: MapPoint, b: MapPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y) < 0.000001;
}

export type ConnectedVenue = ReturnType<typeof createConnectedVenue>;
