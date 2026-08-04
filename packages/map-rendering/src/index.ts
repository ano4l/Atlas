// Shared styling constants and geometry helpers for rendering floor maps,
// routes, and markers. Consumed by apps/mobile (Skia canvas) and
// apps/venue-dashboard (map preview).

export const MAP_STYLE = {
  background: "#F7F8FA",
  wallStroke: "#1F2937",
  walkableFill: "#E5E7EB",
  routeStroke: "#2563EB",
  positionMarker: "#EF4444",
  poiMarker: "#10B981",
} as const;

export function floorBoundsToViewBox(localBounds: [number, number, number, number]): string {
  const [minX, minY, maxX, maxY] = localBounds;
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
}
