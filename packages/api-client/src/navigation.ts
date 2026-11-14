type Point = [number, number];
type Bounds = [number, number, number, number];

export type MapPackage = {
  venue: { id: string; slug: string; name: string; displayName?: string | null };
  mapVersion: { id: string; version: number; status: string };
  floors: Array<{
    id: string; name: string; ordinal: number; publicLabel?: string | null;
    localBounds: Bounds | string;
  }>;
  pois: Array<{
    id: string; floorId: string; name: string; subcategory?: string | null;
    entryPointNodeId: string | null; status: string;
    aliases?: unknown; searchKeywords?: unknown;
  }>;
  graph: {
    nodes: Array<{ id: string; floorId: string; x: number; y: number; nodeType: string }>;
    edges: Array<{
      id: string; fromNodeId: string; toNodeId: string; edgeType: string;
      isRestricted: boolean; closureState: string;
      isOneWay?: boolean; baseCostM?: number;
      validFrom?: string | null; validUntil?: string | null;
      isStepFree?: boolean;
      geometry?: unknown;
    }>;
  };
};

export type RouteRequest = {
  mapVersionId: string;
  start: { floorId: string; x: number; y: number };
  destinationPoiId: string;
  mode?: "shortest" | "step_free";
};

export type Route = {
  mapVersionId: string;
  distanceM: number;
  estimatedTimeS: number;
  validUntilMs?: number | null;
  floors: Array<{ floorId: string; polyline: Point[] }>;
  transitions: Array<{ fromFloorId: string; toFloorId: string; transitionType: string }>;
};

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const optionalString = (value: unknown) => value == null || string(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const point = (value: unknown): value is Point =>
  Array.isArray(value) && value.length === 2 && value.every(finite);

export function isVenueList(value: unknown): value is Array<{ id: string; slug: string }> {
  return Array.isArray(value) && value.every((entry) =>
    record(entry) && string(entry.id) && string(entry.slug),
  );
}

export function isMapPackage(value: unknown): value is MapPackage {
  if (!record(value)) return false;
  const { venue, mapVersion, floors, pois, graph } = value;
  return record(venue) && string(venue.id) && string(venue.slug) &&
    string(venue.name) && optionalString(venue.displayName) &&
    record(mapVersion) && string(mapVersion.id) && finite(mapVersion.version) &&
    Number.isInteger(mapVersion.version) && string(mapVersion.status) &&
    Array.isArray(floors) && floors.length > 0 && floors.every((floor) =>
      record(floor) && string(floor.id) && string(floor.name) &&
      optionalString(floor.publicLabel) && Number.isInteger(floor.ordinal) &&
      (typeof floor.localBounds === "string" ||
        (Array.isArray(floor.localBounds) && floor.localBounds.length === 4 &&
          floor.localBounds.every(finite))),
    ) &&
    Array.isArray(pois) && pois.every((poi) =>
      record(poi) && string(poi.id) && string(poi.floorId) &&
      string(poi.name) && optionalString(poi.subcategory) && string(poi.status) &&
      (poi.entryPointNodeId === null || string(poi.entryPointNodeId)),
    ) &&
    record(graph) && Array.isArray(graph.nodes) && graph.nodes.every((node) =>
      record(node) && string(node.id) && string(node.floorId) &&
      finite(node.x) && finite(node.y) && string(node.nodeType),
    ) &&
    Array.isArray(graph.edges) && graph.edges.every((edge) =>
      record(edge) && string(edge.id) && string(edge.fromNodeId) &&
      string(edge.toNodeId) && string(edge.edgeType) &&
      typeof edge.isRestricted === "boolean" && string(edge.closureState),
    );
}

export function isSearchResponse(value: unknown): value is { results: Array<{ poiId: string }> } {
  return record(value) && Array.isArray(value.results) &&
    value.results.every((hit) => record(hit) && string(hit.poiId));
}

export function isRoute(value: unknown): value is Route {
  return record(value) && string(value.mapVersionId) &&
    finite(value.distanceM) && value.distanceM >= 0 &&
    finite(value.estimatedTimeS) && value.estimatedTimeS >= 0 &&
    (value.validUntilMs == null || (finite(value.validUntilMs) && Number.isSafeInteger(value.validUntilMs))) &&
    Array.isArray(value.floors) && value.floors.length > 0 && value.floors.every((floor) =>
      record(floor) && string(floor.floorId) && Array.isArray(floor.polyline) &&
      floor.polyline.length > 0 && floor.polyline.every(point),
    ) &&
    Array.isArray(value.transitions) && value.transitions.length === value.floors.length - 1 &&
    value.transitions.every((transition) =>
      record(transition) && string(transition.fromFloorId) &&
      string(transition.toFloorId) && string(transition.transitionType),
    );
}
