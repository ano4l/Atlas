// Cross-entity and geometric validation for MapPackageV1, layered on top of
// the structural Zod schema (schema.ts). Every finding is a structured,
// stable-coded issue so CI and the mapping operator UI can act on them.

import type { Floor, NavigationEdge, NavigationNode, PointOfInterest } from "@atlas/spatial-model";
import type { ParsedMapPackageV1 } from "./schema";

export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  /** Stable machine code, e.g. "EDGE_UNKNOWN_NODE". Never renumber or rename released codes. */
  code: string;
  severity: IssueSeverity;
  /** Entity collection the issue belongs to. */
  entityType: "package" | "venue" | "mapVersion" | "floor" | "node" | "edge" | "poi" | "transitionGroup";
  /** ID of the offending entity, when one exists. */
  sourceId?: string;
  /** JSON path into the package, e.g. "edges[3].fromNodeId". */
  path: string;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface Ctx {
  issues: ValidationIssue[];
}

function error(ctx: Ctx, code: string, entityType: ValidationIssue["entityType"], path: string, message: string, sourceId?: string): void {
  ctx.issues.push({ code, severity: "error", entityType, path, message, sourceId });
}

function warn(ctx: Ctx, code: string, entityType: ValidationIssue["entityType"], path: string, message: string, sourceId?: string): void {
  ctx.issues.push({ code, severity: "warning", entityType, path, message, sourceId });
}

const MAX_REASONABLE_EDGE_M = 250;

export function validatePackageSemantics(pkg: ParsedMapPackageV1): ValidationReport {
  const ctx: Ctx = { issues: [] };
  const { venue, mapVersion, floors, nodes, edges, pois } = pkg;

  // --- Package metadata ---
  if (mapVersion.schemaVersion !== 1 || pkg.schemaVersion !== 1) {
    error(ctx, "UNSUPPORTED_SCHEMA_VERSION", "package", "schemaVersion",
      `Only schemaVersion 1 is supported; got package=${String(pkg.schemaVersion)} mapVersion=${String(mapVersion.schemaVersion)}`);
  }
  if (mapVersion.venueId !== venue.id) {
    error(ctx, "MAP_VERSION_VENUE_MISMATCH", "mapVersion", "mapVersion.venueId",
      `Map version ${mapVersion.id} belongs to venue ${mapVersion.venueId}, not package venue ${venue.id}`, mapVersion.id);
  }
  if (venue.defaultMapVersionId !== null && venue.defaultMapVersionId !== mapVersion.id) {
    error(ctx, "DEFAULT_MAP_VERSION_MISMATCH", "venue", "venue.defaultMapVersionId",
      `Venue default map version ${venue.defaultMapVersionId} is not the packaged version ${mapVersion.id}`, venue.id);
  }

  // --- ID uniqueness per collection ---
  assertUniqueIds(ctx, "floor", floors.map((f) => f.id), "floors");
  assertUniqueIds(ctx, "node", nodes.map((n) => n.id), "nodes");
  assertUniqueIds(ctx, "edge", edges.map((e) => e.id), "edges");
  assertUniqueIds(ctx, "poi", pois.map((p) => p.id), "pois");

  const floorsById = new Map(floors.map((f) => [f.id, f]));
  const nodesById = new Map(nodes.map((n) => [n.id, n]));

  // --- Floor → venue membership ---
  floors.forEach((floor, i) => {
    if (floor.venueId !== venue.id) {
      error(ctx, "FLOOR_VENUE_MISMATCH", "floor", `floors[${i}].venueId`,
        `Floor ${floor.id} (${floor.name}) belongs to venue ${floor.venueId}, not ${venue.id}`, floor.id);
    }
  });

  // --- Node → floor references, coordinate bounds ---
  nodes.forEach((node, i) => {
    const floor = floorsById.get(node.floorId);
    if (!floor) {
      error(ctx, "NODE_UNKNOWN_FLOOR", "node", `nodes[${i}].floorId`,
        `Node ${node.id} references unknown floor ${node.floorId}`, node.id);
      return;
    }
    if (!withinBounds(node.x, node.y, floor.localBounds)) {
      error(ctx, "NODE_OUT_OF_BOUNDS", "node", `nodes[${i}]`,
        `Node ${node.id} at (${node.x}, ${node.y}) is outside floor "${floor.name}" bounds [${floor.localBounds.join(", ")}]`, node.id);
    }
  });

  // --- Transition groups ---
  const transitionGroups = new Map<string, NavigationNode[]>();
  nodes.forEach((node, i) => {
    if (node.nodeType === "transition" && node.transitionGroupId === null) {
      error(ctx, "TRANSITION_NODE_WITHOUT_GROUP", "node", `nodes[${i}].transitionGroupId`,
        `Transition node ${node.id} has no transitionGroupId`, node.id);
    }
    if (node.nodeType !== "transition" && node.transitionGroupId !== null) {
      warn(ctx, "NON_TRANSITION_NODE_IN_GROUP", "node", `nodes[${i}].transitionGroupId`,
        `Node ${node.id} has a transitionGroupId but nodeType "${node.nodeType}"`, node.id);
    }
    if (node.transitionGroupId !== null) {
      const members = transitionGroups.get(node.transitionGroupId) ?? [];
      members.push(node);
      transitionGroups.set(node.transitionGroupId, members);
    }
  });
  for (const [groupId, members] of transitionGroups) {
    const memberFloors = new Set(members.map((m) => m.floorId));
    if (memberFloors.size < 2) {
      error(ctx, "TRANSITION_GROUP_SINGLE_FLOOR", "transitionGroup", "nodes",
        `Transition group ${groupId} spans ${memberFloors.size} floor(s); cross-floor groups must span at least 2`, groupId);
    }
  }

  // --- Edge references, geometry, plausibility ---
  edges.forEach((edge, i) => {
    const base = `edges[${i}]`;
    const from = nodesById.get(edge.fromNodeId);
    const to = nodesById.get(edge.toNodeId);
    if (!from) {
      error(ctx, "EDGE_UNKNOWN_NODE", "edge", `${base}.fromNodeId`,
        `Edge ${edge.id} references unknown from-node ${edge.fromNodeId}`, edge.id);
    }
    if (!to) {
      error(ctx, "EDGE_UNKNOWN_NODE", "edge", `${base}.toNodeId`,
        `Edge ${edge.id} references unknown to-node ${edge.toNodeId}`, edge.id);
    }
    if (!from || !to) return;

    if (edge.fromNodeId === edge.toNodeId) {
      error(ctx, "EDGE_SELF_LOOP", "edge", base, `Edge ${edge.id} connects node ${edge.fromNodeId} to itself`, edge.id);
    }

    const crossesFloors = from.floorId !== to.floorId;
    const transitionTypes: ReadonlyArray<NavigationEdge["edgeType"]> = ["stairs", "escalator", "lift", "ramp"];
    if (crossesFloors && !transitionTypes.includes(edge.edgeType)) {
      error(ctx, "CROSS_FLOOR_EDGE_NOT_TRANSITION", "edge", `${base}.edgeType`,
        `Edge ${edge.id} spans floors ${from.floorId} -> ${to.floorId} but edgeType is "${edge.edgeType}"`, edge.id);
    }
    if (!crossesFloors && transitionTypes.includes(edge.edgeType) && edge.edgeType !== "ramp") {
      warn(ctx, "TRANSITION_EDGE_SAME_FLOOR", "edge", `${base}.edgeType`,
        `Edge ${edge.id} is "${edge.edgeType}" but both endpoints are on the same floor`, edge.id);
    }
    if (crossesFloors && from.transitionGroupId === null && to.transitionGroupId === null) {
      warn(ctx, "CROSS_FLOOR_EDGE_WITHOUT_GROUPS", "edge", base,
        `Cross-floor edge ${edge.id} connects nodes with no transitionGroupId`, edge.id);
    }

    validateEdgeGeometry(ctx, edge, from, to, base);

    if (edge.distanceM > MAX_REASONABLE_EDGE_M) {
      warn(ctx, "EDGE_SUSPICIOUSLY_LONG", "edge", `${base}.distanceM`,
        `Edge ${edge.id} is ${edge.distanceM}m; above the ${MAX_REASONABLE_EDGE_M}m sanity threshold for a single indoor segment`, edge.id);
    }
  });

  // --- POI references ---
  const seenAliases = new Map<string, string>();
  pois.forEach((poi, i) => {
    const base = `pois[${i}]`;
    if (poi.venueId !== venue.id) {
      error(ctx, "POI_VENUE_MISMATCH", "poi", `${base}.venueId`,
        `POI ${poi.id} (${poi.name}) belongs to venue ${poi.venueId}, not ${venue.id}`, poi.id);
    }
    const floor = floorsById.get(poi.floorId);
    if (!floor) {
      error(ctx, "POI_UNKNOWN_FLOOR", "poi", `${base}.floorId`,
        `POI ${poi.id} (${poi.name}) references unknown floor ${poi.floorId}`, poi.id);
    }
    if (poi.entranceNodeIds.length === 0) {
      error(ctx, "POI_WITHOUT_ENTRANCE", "poi", `${base}.entranceNodeIds`,
        `POI ${poi.id} (${poi.name}) has no entrance node and is unroutable`, poi.id);
    }
    poi.entranceNodeIds.forEach((nodeId, j) => {
      const node = nodesById.get(nodeId);
      if (!node) {
        error(ctx, "POI_UNKNOWN_ENTRANCE_NODE", "poi", `${base}.entranceNodeIds[${j}]`,
          `POI ${poi.id} (${poi.name}) entrance references unknown node ${nodeId}`, poi.id);
        return;
      }
      if (node.floorId !== poi.floorId) {
        error(ctx, "POI_ENTRANCE_WRONG_FLOOR", "poi", `${base}.entranceNodeIds[${j}]`,
          `POI ${poi.id} (${poi.name}) entrance node ${nodeId} is on a different floor`, poi.id);
      }
    });
    if (poi.openingStatus === "closed") {
      warn(ctx, "POI_CLOSED", "poi", base, `POI ${poi.id} (${poi.name}) is permanently closed`, poi.id);
    }
    for (const alias of poi.aliases) {
      const key = alias.trim().toLowerCase();
      const existing = seenAliases.get(key);
      if (existing && existing !== poi.id) {
        warn(ctx, "POI_DUPLICATE_ALIAS", "poi", `${base}.aliases`,
          `Alias "${alias}" is used by both ${existing} and ${poi.id} (${poi.name})`, poi.id);
      } else {
        seenAliases.set(key, poi.id);
      }
    }
    const ring = poi.spaceGeometry.coordinates[0];
    if (ring.length >= 2) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        error(ctx, "POI_GEOMETRY_NOT_CLOSED", "poi", `${base}.spaceGeometry`,
          `POI ${poi.id} (${poi.name}) polygon ring is not closed`, poi.id);
      }
    }
  });

  // --- Graph connectivity ---
  checkConnectivity(ctx, nodes, edges, pois);

  const errors = ctx.issues.filter((issue) => issue.severity === "error");
  const warnings = ctx.issues.filter((issue) => issue.severity === "warning");
  return { valid: errors.length === 0, errors, warnings };
}

function assertUniqueIds(ctx: Ctx, entityType: ValidationIssue["entityType"], ids: string[], collection: string): void {
  const seen = new Set<string>();
  ids.forEach((id, i) => {
    if (seen.has(id)) {
      error(ctx, "DUPLICATE_ID", entityType, `${collection}[${i}].id`,
        `Duplicate ${entityType} id ${id}`, id);
    }
    seen.add(id);
  });
}

function withinBounds(x: number, y: number, bounds: [number, number, number, number]): boolean {
  const [minX, minY, maxX, maxY] = bounds;
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

function validateEdgeGeometry(
  ctx: Ctx,
  edge: NavigationEdge,
  from: NavigationNode,
  to: NavigationNode,
  base: string,
): void {
  const coords = edge.geometry.coordinates;
  if (coords.length < 2) {
    error(ctx, "EDGE_GEOMETRY_TOO_SHORT", "edge", `${base}.geometry`,
      `Edge ${edge.id} geometry has fewer than 2 positions`, edge.id);
    return;
  }
  for (const [k, position] of coords.entries()) {
    if (!Number.isFinite(position[0]) || !Number.isFinite(position[1])) {
      error(ctx, "GEOMETRY_NON_FINITE", "edge", `${base}.geometry.coordinates[${k}]`,
        `Edge ${edge.id} geometry contains a non-finite coordinate`, edge.id);
      return;
    }
  }
  const start = coords[0];
  const end = coords[coords.length - 1];
  const toleranceM = 1.0;
  if (Math.hypot(start[0] - from.x, start[1] - from.y) > toleranceM) {
    warn(ctx, "EDGE_GEOMETRY_START_MISMATCH", "edge", `${base}.geometry.coordinates[0]`,
      `Edge ${edge.id} geometry starts more than ${toleranceM}m from its from-node`, edge.id);
  }
  if (Math.hypot(end[0] - to.x, end[1] - to.y) > toleranceM) {
    warn(ctx, "EDGE_GEOMETRY_END_MISMATCH", "edge", `${base}.geometry.coordinates[${coords.length - 1}]`,
      `Edge ${edge.id} geometry ends more than ${toleranceM}m from its to-node`, edge.id);
  }
  // Polyline length vs declared distance sanity check.
  let polylineLength = 0;
  for (let k = 1; k < coords.length; k++) {
    polylineLength += Math.hypot(coords[k][0] - coords[k - 1][0], coords[k][1] - coords[k - 1][1]);
  }
  if (polylineLength > 0 && Math.abs(polylineLength - edge.distanceM) / polylineLength > 0.25) {
    warn(ctx, "EDGE_DISTANCE_MISMATCH", "edge", `${base}.distanceM`,
      `Edge ${edge.id} declares ${edge.distanceM}m but its geometry measures ${polylineLength.toFixed(1)}m`, edge.id);
  }
}

function checkConnectivity(
  ctx: Ctx,
  nodes: NavigationNode[],
  edges: NavigationEdge[],
  pois: PointOfInterest[],
): void {
  if (nodes.length === 0) {
    error(ctx, "GRAPH_EMPTY", "node", "nodes", "Package contains no navigation nodes");
    return;
  }
  const adjacency = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    const list = adjacency.get(a) ?? [];
    list.push(b);
    adjacency.set(a, list);
  };
  for (const edge of edges) {
    link(edge.fromNodeId, edge.toNodeId);
    if (edge.directionality === "bidirectional") {
      link(edge.toNodeId, edge.fromNodeId);
    }
  }

  const visited = new Set<string>();
  const stack = [nodes[0].id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) stack.push(next);
    }
  }

  const unreachable = nodes.filter((n) => !visited.has(n.id));
  for (const node of unreachable) {
    error(ctx, "NODE_UNREACHABLE", "node", "nodes",
      `Node ${node.id} is disconnected from the main graph component`, node.id);
  }

  const reachable = new Set(visited);
  for (const poi of pois) {
    const routable = poi.entranceNodeIds.some((id) => reachable.has(id));
    if (!routable && poi.entranceNodeIds.length > 0) {
      error(ctx, "POI_UNROUTABLE", "poi", "pois",
        `POI ${poi.id} (${poi.name}) has no entrance node in the reachable graph`, poi.id);
    }
  }

  // Isolated POIs: entrance exists but is a dead-end anchor with a single
  // connection is fine; a POI whose entrance has no edges at all is not.
  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.fromNodeId, (degree.get(edge.fromNodeId) ?? 0) + 1);
    degree.set(edge.toNodeId, (degree.get(edge.toNodeId) ?? 0) + 1);
  }
  for (const poi of pois) {
    if (poi.entranceNodeIds.length > 0 && poi.entranceNodeIds.every((id) => (degree.get(id) ?? 0) === 0)) {
      warn(ctx, "POI_ISOLATED", "poi", "pois",
        `POI ${poi.id} (${poi.name}) entrance nodes have no connecting edges`, poi.id);
    }
  }
}
