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
    const local = nextPoint ? [position, nextPoint] : [position];
    // Minimum context stops one-point/short legs zooming into an illegible dot.
    const xs = local.map((p) => p.x),
      ys = local.map((p) => p.y);
    const x = (Math.min(...xs) + Math.max(...xs)) / 2;
    const y = (Math.min(...ys) + Math.max(...ys)) / 2;
    return [...local, { x: x - 55, y: y - 65 }, { x: x + 55, y: y + 65 }];
  }
  return floor;
}
