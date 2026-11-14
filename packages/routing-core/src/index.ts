// Graph construction and route rules. See techspec.md §7.4.
// Routing pipeline: apply constraints -> build valid edge set -> shortest
// valid route -> apply commercial routing policy (isolated, see routing-core
// should NOT itself implement commercial influence; see services/platform-api).

import type { NavigationEdge, NavigationNode } from "@atlas/spatial-model";

type GraphNode = Pick<NavigationNode, "id" | "floorId" | "x" | "y">;
type GraphEdge = Pick<NavigationEdge, "fromNodeId" | "toNodeId" | "distanceM" | "estimatedTimeS" | "directionality" | "isRestricted">;

export interface NavigationGraph<Edge extends GraphEdge = NavigationEdge> {
  nodes: Map<string, GraphNode>;
  edges: Map<string, RouteSegment<Edge>[]>;
}

export function buildGraph<Edge extends GraphEdge>(nodes: GraphNode[], edges: Edge[]): NavigationGraph<Edge> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, RouteSegment<Edge>[]>();
  const add = (edge: Edge, fromNodeId: string, toNodeId: string) => {
    const segments = adjacency.get(fromNodeId) ?? [];
    segments.push({ edge, fromNodeId, toNodeId });
    adjacency.set(fromNodeId, segments);
  };

  for (const edge of edges) {
    if (edge.isRestricted || !Number.isFinite(edge.distanceM) || edge.distanceM <= 0 ||
        !nodeMap.has(edge.fromNodeId) || !nodeMap.has(edge.toNodeId)) continue;
    if (edge.directionality !== "backward") add(edge, edge.fromNodeId, edge.toNodeId);
    if (edge.directionality !== "forward") add(edge, edge.toNodeId, edge.fromNodeId);
  }

  return { nodes: nodeMap, edges: adjacency };
}

export interface RouteSegment<Edge extends GraphEdge = NavigationEdge> {
  edge: Edge;
  fromNodeId: string;
  toNodeId: string;
}

export interface RouteResult<Edge extends GraphEdge = NavigationEdge> {
  segments: RouteSegment<Edge>[];
  distanceM: number;
  estimatedTimeS: number;
}

/** Dijkstra search: routing costs may be lower than coordinate distance. */
export function findShortestRoute<Edge extends GraphEdge>(
  graph: NavigationGraph<Edge>,
  startNodeId: string,
  destinationNodeId: string
): RouteResult<Edge> | null {
  if (!graph.nodes.has(startNodeId) || !graph.nodes.has(destinationNodeId)) return null;
  const distances = new Map<string, number>([[startNodeId, 0]]);
  const previous = new Map<string, RouteSegment<Edge>>();

  const frontier = new Set<string>([startNodeId]);

  while (frontier.size > 0) {
    let current: string | null = null;
    let bestScore = Infinity;
    for (const nodeId of frontier) {
      const score = distances.get(nodeId) ?? Infinity;
      if (score < bestScore || (score === bestScore && current !== null && nodeId < current)) {
        bestScore = score;
        current = nodeId;
      }
    }
    if (current === null) break;
    frontier.delete(current);

    if (current === destinationNodeId) break;
    for (const segment of graph.edges.get(current) ?? []) {
      const neighborId = segment.toNodeId;
      const candidateDistance = bestScore + segment.edge.distanceM;
      if (candidateDistance < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, candidateDistance);
        previous.set(neighborId, segment);
        frontier.add(neighborId);
      }
    }
  }

  if (!distances.has(destinationNodeId)) return null;

  const segments: RouteSegment<Edge>[] = [];
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
