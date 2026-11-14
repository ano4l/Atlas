import { IndoorFloor, MapPoint, POIItem } from "./types";

export type Viewport = {
  width: number;
  height: number;
  top: number;
  bottom: number;
  left?: number;
  right?: number;
};
export type MapCamera = { x: number; y: number; scale: number };
type MapExtent = { left: number; right: number; top: number; bottom: number };
export const MIN_ZOOM = 0.18;
export const MAX_ZOOM = 2.4;
export function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.max(min, Math.min(max, value));
}
export function mapExtent(points: MapPoint[]): MapExtent {
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  };
}
export function fitCamera(points: MapPoint[], viewport: Viewport): MapCamera {
  const { left, right, top, bottom } = mapExtent(points);
  const availableHeight = Math.max(
    100,
    viewport.height - viewport.top - viewport.bottom,
  );
  const insetLeft = viewport.left ?? 24,
    insetRight = viewport.right ?? 24;
  const availableWidth = Math.max(120, viewport.width - insetLeft - insetRight);
  const scale = clamp(
    Math.min(
      availableWidth / Math.max(140, right - left + 40),
      availableHeight / Math.max(160, bottom - top + 48),
    ),
    MIN_ZOOM,
    1.5,
  );
  return {
    scale,
    x: insetLeft + availableWidth / 2 - ((left + right) / 2) * scale,
    y: viewport.top + availableHeight / 2 - ((top + bottom) / 2) * scale,
  };
}
export function panLimits(
  viewport: Viewport,
  extent: MapExtent,
  scale: number,
) {
  "worklet";
  const left = viewport.left ?? 0;
  const right = viewport.width - (viewport.right ?? 0);
  const top = viewport.top;
  const bottom = Math.max(top + 100, viewport.height - viewport.bottom);
  const horizontal = (right - left) * 0.3;
  const vertical = (bottom - top) * 0.3;
  return {
    minX: left + horizontal - extent.right * scale,
    maxX: right - horizontal - extent.left * scale,
    minY: top + vertical - extent.bottom * scale,
    maxY: bottom - vertical - extent.top * scale,
  };
}
export function zoomAt(
  camera: MapCamera,
  focal: MapPoint,
  nextScale: number,
): MapCamera {
  "worklet";
  const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
  return {
    scale,
    x: focal.x - ((focal.x - camera.x) / camera.scale) * scale,
    y: focal.y - ((focal.y - camera.y) / camera.scale) * scale,
  };
}
export function pointInPolygon(point: MapPoint, polygon: MapPoint[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
/** Shapes take priority over nearby points, so a label tap chooses its actual unit. */
export function hitTestPlace(
  point: MapPoint,
  floor: IndoorFloor,
  places: POIItem[],
  scale: number,
) {
  const room = floor.rooms.find((r) => pointInPolygon(point, r.points));
  if (room) return places.find((p) => p.id === room.id);
  const nearby = places
    .filter((p) => p.floorLevel === floor.level)
    .map((p) => ({
      poi: p,
      distance: Math.hypot(p.point.x - point.x, p.point.y - point.y),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
  return nearby && nearby.distance <= 24 / scale ? nearby.poi : undefined;
}
export function storeNameLines(name: string): string[] {
  if (name.length <= 13) return [name];
  const words = name.split(" ");
  let split = 1,
    score = Infinity;
  for (let i = 1; i < words.length; i++) {
    const difference = Math.abs(
      words.slice(0, i).join(" ").length - words.slice(i).join(" ").length,
    );
    if (difference < score) {
      split = i;
      score = difference;
    }
  }
  return words.length > 1
    ? [words.slice(0, split).join(" "), words.slice(split).join(" ")]
    : [name];
}
