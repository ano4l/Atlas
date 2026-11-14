import { MapPoint } from "./types";
export type CameraMode = "floor" | "route" | "follow" | "manual";
/** Overview always frames only the visible floor; follow shows the next local leg. */
export function cameraPoints(
  mode: CameraMode,
  floor: MapPoint[],
  route: MapPoint[] | undefined,
  position: MapPoint,
  nextPoint?: MapPoint,
): MapPoint[] {
  if (mode === "manual") return [];
  if (mode === "route" && route?.length) return route;
  if (mode === "follow") {
    // Keep the user central; a bounded look-ahead avoids zoom jumps on long legs.
    const dx = (nextPoint?.x ?? position.x) - position.x;
    const dy = (nextPoint?.y ?? position.y) - position.y;
    const length = Math.hypot(dx, dy) || 1;
    const ahead = Math.min(length, 80);
    const x = position.x + (dx / length) * ahead * 0.25;
    const y = position.y + (dy / length) * ahead * 0.25;
    return [
      { x: x - 190, y: y - 160 },
      { x: x + 190, y: y + 160 },
    ];
  }
  return floor;
}
