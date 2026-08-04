// Graph construction and route rules. See techspec.md §7.4.
// Routing pipeline: apply constraints -> build valid edge set -> A* shortest
// valid route -> apply commercial routing policy (isolated, see routing-core
// should NOT itself implement commercial influence; see services/platform-api).

import type { NavigationEdge, NavigationNode } from "@atlas/spatial-model";

export interface NavigationGraph {
  nodes: Map<string, NavigationNode>;
  edges: Map<string, NavigationEdge[]>; // adjacency list keyed by fromNodeId
}

export function buildGraph(nodes: NavigationNode[], edges: NavigationEdge[]): NavigationGraph {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, NavigationEdge[]>();

  for (const edge of edges) {
    if (edge.isRestricted) continue;
    const list = adjacency.get(edge.fromNodeId) ?? [];
    list.push(edge);
    adjacency.set(edge.fromNodeId, list);

    if (edge.directionality === "bidirectional") {
      const reverse = adjacency.get(edge.toNodeId) ?? [];
      reverse.push(edge);
      adjacency.set(edge.toNodeId, reverse);
    }
  }

  return { nodes: nodeMap, edges: adjacency };
}

export interface RouteSegment {
  edge: NavigationEdge;
  fromNodeId: string;
  toNodeId: string;
}

export interface RouteResult {
  segments: RouteSegment[];
  distanceM: number;
  estimatedTimeS: number;
}

/**
 * A* shortest path using straight-line distance as the admissible heuristic.
 * Placeholder implementation for Phase 0/1 scaffolding — to be exercised
 * against the synthetic two-floor fixture (techspec.md §17 Phase 1).
 */
export function findShortestRoute(
  graph: NavigationGraph,
  startNodeId: string,
  destinationNodeId: string
): RouteResult | null {
  const distances = new Map<string, number>([[startNodeId, 0]]);
  const previous = new Map<string, RouteSegment>();
  const visited = new Set<string>();

  const heuristic = (nodeId: string) => {
    const a = graph.nodes.get(nodeId);
    const b = graph.nodes.get(destinationNodeId);
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const frontier = new Set<string>([startNodeId]);

  while (frontier.size > 0) {
    let current: string | null = null;
    let bestScore = Infinity;
    for (const nodeId of frontier) {
      const score = (distances.get(nodeId) ?? Infinity) + heuristic(nodeId);
      if (score < bestScore) {
        bestScore = score;
        current = nodeId;
      }
    }
    if (current === null) break;
    frontier.delete(current);

    if (current === destinationNodeId) break;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const edge of graph.edges.get(current) ?? []) {
      const neighborId = edge.fromNodeId === current ? edge.toNodeId : edge.fromNodeId;
      const candidateDistance = (distances.get(current) ?? Infinity) + edge.distanceM;
      if (candidateDistance < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, candidateDistance);
        previous.set(neighborId, { edge, fromNodeId: current, toNodeId: neighborId });
        frontier.add(neighborId);
      }
    }
  }

  if (!distances.has(destinationNodeId)) return null;

  const segments: RouteSegment[] = [];
  let cursor = destinationNodeId;
  while (cursor !== startNodeId) {
    const segment = previous.get(cursor);
    if (!segment) return null;
    segments.unshift(segment);
    cursor = segment.fromNodeId;
  }

  return {
    segments,
    distanceM: distances.get(destinationNodeId) ?? 0,
    estimatedTimeS: segments.reduce((sum, s) => sum + s.edge.estimatedTimeS, 0),
  };
}
