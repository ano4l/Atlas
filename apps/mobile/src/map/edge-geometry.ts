type Coordinate = [number, number];
type Endpoint = { x: number; y: number };

export function edgePoints(geometry: unknown, from: Endpoint, to: Endpoint): Coordinate[] {
  return authoredEdgePoints(geometry, from, to) ?? [[from.x, from.y], [to.x, to.y]];
}

export function authoredEdgePoints(geometry: unknown, from: Endpoint, to: Endpoint): Coordinate[] | null {
  const start: Coordinate = [from.x, from.y];
  const end: Coordinate = [to.x, to.y];
  if (typeof geometry === "string") {
    try { geometry = JSON.parse(geometry); } catch { return null; }
  }
  const points = geometry && typeof geometry === "object" &&
    "type" in geometry && geometry.type === "LineString" && "coordinates" in geometry
    ? geometry.coordinates : geometry;
  if (!Array.isArray(points) || points.length < 2 || !points.every((point): point is Coordinate =>
    Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]))) {
    return null;
  }

  // Allow the same one-metre endpoint tolerance as the map authoring validator.
  const mismatch = (first: Coordinate, last: Coordinate) => {
    const fromError = Math.hypot(first[0] - from.x, first[1] - from.y);
    const toError = Math.hypot(last[0] - to.x, last[1] - to.y);
    return fromError <= 1 && toError <= 1 ? fromError + toError : Infinity;
  };
  const first = points[0];
  const last = points[points.length - 1];
  const forward = mismatch(first, last);
  const reverse = mismatch(last, first);
  if (forward === Infinity && reverse === Infinity) return null;
  const interior = points.slice(1, -1);
  if (reverse < forward) interior.reverse();
  return [start, ...interior, end];
}
