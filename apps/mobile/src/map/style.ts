import type { MapPoint } from "./types";

/** What a place sells, which decides its tint, badge colour and glyph. */
export type PlaceKind = "shop" | "food" | "health" | "tech" | "home" | "unknown";

export function placeKind(category?: string): PlaceKind {
  if (!category || category === "Unconfirmed tenant") return "unknown";
  if (/Dining|Food|Coffee|Restaurant/.test(category)) return "food";
  if (/Health|Beauty|Pharmacy/.test(category)) return "health";
  if (/Electronics|Tech/.test(category)) return "tech";
  if (/Home|Entertainment|Books|Gifts|Flowers/.test(category)) return "home";
  return "shop";
}

type Tone = {
  /** Unit floor. */
  fill: string;
  /** Shaded lower edge that lifts the unit off the walkway. */
  lip: string;
  /** Label text on the map. */
  ink: string;
  /** Saturated badge behind a white glyph. */
  badge: string;
};

export type MapPalette = {
  canvas: string;
  grounds: string;
  roadFill: string;
  roadCasing: string;
  roadText: string;
  plate: string;
  plateEdge: string;
  plateShadow: string;
  court: string;
  plant: string;
  plantLight: string;
  plantEdge: string;
  bench: string;
  areaText: string;
  label: string;
  halo: string;
  tones: Record<PlaceKind, Tone>;
  selectedFill: string;
  selectedStroke: string;
  route: string;
  routeCasing: string;
  routeHalo: string;
  routeTravelled: string;
  routeArrow: string;
  puck: string;
  puckRing: string;
  pin: string;
  pinDot: string;
};

const light: MapPalette = {
  canvas: "#E9EEF2",
  grounds: "#DDEBDD",
  roadFill: "#FFFFFF",
  roadCasing: "#C8D1D9",
  roadText: "#75828F",
  plate: "#FFFFFF",
  plateEdge: "#C2CBD4",
  plateShadow: "#0B2540",
  court: "#F3F7FA",
  plant: "#A9D9A6",
  plantLight: "#CDEBC6",
  plantEdge: "#86C283",
  bench: "#C9A678",
  areaText: "#8A96A3",
  label: "#14212E",
  halo: "#FFFFFF",
  tones: {
    unknown: { fill: "#E6EAEE", lip: "#C5CCD4", ink: "#6B7785", badge: "#8C98A6" },
    shop: { fill: "#DCE6FF", lip: "#B1C4F4", ink: "#2247C4", badge: "#3D6DF2" },
    food: { fill: "#FFE5C6", lip: "#F0C592", ink: "#A2540A", badge: "#F08A24" },
    health: { fill: "#D4F1DF", lip: "#A6DABC", ink: "#12734A", badge: "#1FA76E" },
    tech: { fill: "#D7EEFA", lip: "#A6D4EA", ink: "#0C6890", badge: "#16A0D6" },
    home: { fill: "#EADFFC", lip: "#CBB7F1", ink: "#6238BE", badge: "#8756F0" },
  },
  selectedFill: "#CFE0FF",
  selectedStroke: "#2F6BFF",
  route: "#2F6BFF",
  routeCasing: "#1840B8",
  routeHalo: "#FFFFFF",
  routeTravelled: "#B4BFCB",
  routeArrow: "#FFFFFF",
  puck: "#2F6BFF",
  puckRing: "#FFFFFF",
  pin: "#0E2236",
  pinDot: "#C8F45C",
};

const dark: MapPalette = {
  canvas: "#0C151C",
  grounds: "#12232A",
  roadFill: "#1F2C36",
  roadCasing: "#2A3944",
  roadText: "#8090A0",
  plate: "#1A2630",
  plateEdge: "#34434F",
  plateShadow: "#000000",
  court: "#22303B",
  plant: "#2F5B47",
  plantLight: "#3E7359",
  plantEdge: "#27493A",
  bench: "#7B6B55",
  areaText: "#7C8B9A",
  label: "#EAF0F6",
  halo: "#0C151C",
  tones: {
    unknown: { fill: "#2B3945", lip: "#131B22", ink: "#96A4B3", badge: "#6F7E8D" },
    shop: { fill: "#2A3B66", lip: "#162140", ink: "#AFC6FF", badge: "#5B86FF" },
    food: { fill: "#503B25", lip: "#2B1F12", ink: "#FFC88C", badge: "#F29A3F" },
    health: { fill: "#21473A", lip: "#11271F", ink: "#90E0B9", badge: "#2DBE82" },
    tech: { fill: "#1E4356", lip: "#0F2531", ink: "#92D8F6", badge: "#2BB1E6" },
    home: { fill: "#3B3263", lip: "#201A3A", ink: "#CFBBFF", badge: "#9A70FF" },
  },
  selectedFill: "#27407A",
  selectedStroke: "#7FA6FF",
  route: "#5C8DFF",
  routeCasing: "#0F2466",
  routeHalo: "#0C151C",
  routeTravelled: "#4B5A68",
  routeArrow: "#FFFFFF",
  puck: "#5C8DFF",
  puckRing: "#FFFFFF",
  pin: "#F2F6FA",
  pinDot: "#2F6BFF",
};

export const mapPalette = (isDark: boolean): MapPalette => (isDark ? dark : light);

const distance = (a: MapPoint, b: MapPoint) => Math.hypot(b.x - a.x, b.y - a.y);

/** Total length of a polyline in map units. */
export function pathLength(path: MapPoint[]) {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += distance(path[i - 1], path[i]);
  return total;
}

/** Distance along the path of the point on it nearest to `position`. */
export function progressAlong(path: MapPoint[], position: MapPoint) {
  let nearest = Infinity;
  let completed = 0;
  let offset = 0;
  for (let i = 1; i < path.length; i++) {
    const start = path[i - 1];
    const dx = path[i].x - start.x;
    const dy = path[i].y - start.y;
    const length = Math.hypot(dx, dy);
    if (length) {
      const x = position.x - start.x;
      const y = position.y - start.y;
      const fraction = Math.max(
        0,
        Math.min(1, (x * dx + y * dy) / (length * length)),
      );
      const gap = Math.hypot(x - fraction * dx, y - fraction * dy);
      if (gap < nearest) {
        nearest = gap;
        completed = offset + fraction * length;
      }
    }
    offset += length;
  }
  return completed;
}

/** Splits a polyline at a distance from its start. */
export function splitPath(path: MapPoint[], at: number) {
  const before: MapPoint[] = [path[0]];
  const after: MapPoint[] = [];
  let offset = 0;
  for (let i = 1; i < path.length; i++) {
    const length = distance(path[i - 1], path[i]);
    if (after.length) {
      after.push(path[i]);
    } else if (offset + length >= at) {
      const fraction = length ? (at - offset) / length : 0;
      const cut = {
        x: path[i - 1].x + (path[i].x - path[i - 1].x) * fraction,
        y: path[i - 1].y + (path[i].y - path[i - 1].y) * fraction,
      };
      before.push(cut);
      after.push(cut, path[i]);
    } else {
      before.push(path[i]);
    }
    offset += length;
  }
  if (!after.length) after.push(path[path.length - 1]);
  return { before, after };
}

/** SVG path with each corner rounded, so a route reads as one continuous line. */
export function roundedPath(path: MapPoint[], radius: number) {
  if (path.length < 2) return "";
  let d = `M${path[0].x},${path[0].y}`;
  for (let i = 1; i < path.length - 1; i++) {
    const previous = path[i - 1];
    const corner = path[i];
    const next = path[i + 1];
    const into = distance(previous, corner);
    const out = distance(corner, next);
    const r = Math.min(radius, into / 2, out / 2);
    if (r < 0.5) {
      d += ` L${corner.x},${corner.y}`;
      continue;
    }
    const ax = corner.x + ((previous.x - corner.x) / into) * r;
    const ay = corner.y + ((previous.y - corner.y) / into) * r;
    const bx = corner.x + ((next.x - corner.x) / out) * r;
    const by = corner.y + ((next.y - corner.y) / out) * r;
    d += ` L${ax},${ay} Q${corner.x},${corner.y} ${bx},${by}`;
  }
  const end = path[path.length - 1];
  return `${d} L${end.x},${end.y}`;
}

export type LabelBox = {
  id: string;
  point: MapPoint;
  /** Screen size in points when shown in full. */
  width: number;
  height: number;
  priority: number;
};

/**
 * Greedy collision pass at one zoom level. Higher priority labels keep their
 * text; a label that would overlap one already placed is reduced to its dot.
 */
export function placeLabels(boxes: LabelBox[], zoom: number) {
  const shown: { x: number; y: number; w: number; h: number }[] = [];
  const full = new Set<string>();
  for (const box of [...boxes].sort((a, b) => b.priority - a.priority)) {
    const x = box.point.x * zoom;
    const y = box.point.y * zoom;
    const clear = shown.every(
      (other) =>
        Math.abs(other.x - x) * 2 >= other.w + box.width + 6 ||
        Math.abs(other.y - y) * 2 >= other.h + box.height + 4,
    );
    if (clear) {
      full.add(box.id);
      shown.push({ x, y, w: box.width, h: box.height });
    }
  }
  return full;
}
