import {
  IndoorFloor,
  IndoorMapData,
  MapPoint,
  MapRoom,
  POIItem,
} from "./map/types";

/** Hand-traced from the user's schematic. One reference level; no surveyed scale or live tenant data. */
const p = (x: number, y: number): MapPoint => ({ x: x * 2, y: y * 2 });
const path = (coords: number[][]) => coords.map(([x, y]) => p(x, y));
export const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
): MapPoint[] => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];
const box = (x: number, y: number, w: number, h: number) =>
  rect(x * 2, y * 2, w * 2, h * 2);

// Centre lines follow the white galleries in the reference. The west marker is the demo origin.
const corridorPaths = [
  path([
    [166, 190],
    [216, 190],
    [330, 190],
    [342, 198],
    [354, 214],
    [359, 232],
    [367, 246],
    [367, 548],
  ]),
  path([
    [216, 190],
    [216, 438],
    [173, 438],
    [173, 450],
  ]),
  path([
    [216, 430],
    [367, 430],
  ]),
  path([
    [216, 380],
    [273, 380],
    [273, 430],
  ]),
  path([
    [240, 430],
    [240, 503],
  ]),
  path([
    [216, 461],
    [240, 461],
  ]),
];
const snapToWalkway = (point: MapPoint) => {
  let best = { point, distance: Infinity };
  for (const points of corridorPaths)
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy),
        ),
      );
      const projection = { x: a.x + t * dx, y: a.y + t * dy };
      const distance = Math.hypot(
        point.x - projection.x,
        point.y - projection.y,
      );
      if (distance < best.distance) best = { point: projection, distance };
    }
  return best.point;
};
const rooms: MapRoom[] = [];
const directory: POIItem[] = [];
function addUnit(
  points: MapPoint[],
  identity?: {
    id: string;
    name: string;
    category: string;
    point: MapPoint;
    label?: MapPoint;
  },
) {
  const index = rooms.length + 1;
  const unitLabel = `S${String(index).padStart(3, "0")}`;
  const xs = points.map((point) => point.x),
    ys = points.map((point) => point.y);
  const label = identity?.label || {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
  const id = identity?.id || `unit-${unitLabel.toLowerCase()}`;
  const name = identity?.name || `Unit ${unitLabel}`;
  const category = identity?.category || "Unconfirmed tenant";
  rooms.push({
    id,
    name,
    category,
    points,
    label,
    labelMode: identity ? "always" : "detail",
  });
  // Unconfirmed units end at the closest mapped gallery, rather than inventing a shop door through a wall.
  const point = identity?.point || snapToWalkway(label);
  directory.push({
    id,
    name,
    category,
    floorLevel: 1,
    floorName: "Reference level",
    point,
    unitLabel,
    distanceM: 0,
    walkTimeMin: 0,
    openingStatus: identity
      ? "Name visible in reference"
      : "Tenant unconfirmed",
    entranceInfo: identity
      ? "Mapped approach via the gallery. Confirm the entrance on site."
      : "The demo ends on the nearest gallery. The shop entrance is unverified.",
    description: identity
      ? "Store name from the reference map. Current tenancy, hours and access are unverified."
      : "This unit has a demo reference code. The tenant is unverified.",
  });
}
const unit = (x: number, y: number, w: number, h: number) =>
  addUnit(box(x, y, w, h));
const stack = (x: number, y: number, w: number, heights: number[]) => {
  let top = y;
  heights.forEach((h) => {
    unit(x, top, w, h);
    top += h + 1;
  });
};
const row = (x: number, y: number, widths: number[], h: number) => {
  let left = x;
  widths.forEach((w) => {
    unit(left, y, w, h);
    left += w + 1;
  });
};

// West perimeter and its narrow shop frontages.
unit(130, 104, 31, 147);
unit(170, 131, 15, 31);
row(170, 164, [15, 7, 7, 7], 14);
stack(170, 201, 15, [17, 10, 9, 8]);
stack(186, 201, 23, [7, 9, 9, 7, 9]);
unit(130, 252, 39, 49);
stack(170, 253, 14, [12, 12, 9, 12]);
stack(186, 253, 23, [8, 9, 8, 9, 10]);
unit(130, 311, 39, 50);
unit(130, 363, 39, 39);
stack(170, 311, 39, [14, 12, 11, 11, 11, 10]);
row(170, 389, [7, 31], 14);
addUnit(
  path([
    [133, 417],
    [145, 406],
    [155, 406],
    [167, 421],
    [166, 437],
    [166, 486],
    [160, 499],
    [148, 502],
    [129, 487],
  ]),
);
unit(170, 420, 39, 15);
unit(170, 461, 9, 20);
unit(180, 462, 8, 20);
unit(170, 483, 18, 19);
unit(197, 463, 10, 19);
unit(208, 463, 17, 19);
row(197, 484, [13, 14], 18);

// North wing and central island. Small divisions preserve the rhythm of the supplied plan.
row(280, 170, [14, 14, 15], 14);
row(220, 200, [10, 10, 10, 13], 20);
stack(220, 222, 35, [14, 10, 11, 10, 11, 11, 10, 10, 9, 9, 10]);
row(226, 358, [8, 8, 8, 9], 13);
unit(257, 222, 38, 46);
unit(257, 270, 51, 69);
unit(257, 341, 25, 15);
row(265, 200, [13, 14, 14], 21);
unit(297, 222, 11, 46);
stack(310, 200, 23, [10, 12, 28]);
stack(310, 256, 51, [14, 13, 14]);
stack(329, 301, 27, [8, 8, 10, 10]);
unit(310, 301, 17, 38);
unit(284, 341, 21, 32);
unit(307, 341, 20, 28);
unit(329, 341, 27, 28);
unit(286, 375, 19, 22);
unit(307, 371, 20, 26);
unit(329, 371, 19, 16);
unit(349, 371, 7, 27);
row(226, 398, [9, 9, 8, 9], 21);
row(282, 399, [9, 8, 8, 8, 8, 8, 8, 8], 20);

// East gallery and south wing.
unit(380, 255, 64, 31);
unit(380, 290, 64, 18);
unit(380, 311, 64, 17);
stack(377, 373, 21, [13, 10, 10, 10]);
unit(429, 350, 15, 54);
unit(430, 405, 14, 17);
stack(377, 438, 21, [8, 8, 9, 9, 10, 12]);
unit(445, 442, 8, 77);
unit(430, 470, 14, 49);
unit(380, 534, 73, 13);
stack(255, 442, 19, [18, 12, 13, 13]);
row(277, 442, [9, 9, 9, 9], 50);
stack(318, 442, 35, [18, 13, 13, 21, 10, 11, 11]);

addUnit(
  path([
    [186, 131],
    [327, 131],
    [344, 166],
    [328, 169],
    [279, 169],
    [279, 178],
    [186, 178],
  ]),
  {
    id: "edgars",
    name: "Edgars",
    category: "Department Store",
    point: p(250, 178),
    label: p(254, 154),
  },
);
addUnit(box(380, 330, 48, 42), {
  id: "mr-price",
  name: "Mr Price",
  category: "Fashion & Clothing",
  point: p(380, 360),
  label: p(404, 350),
});
addUnit(
  path([
    [399, 405],
    [427, 405],
    [427, 423],
    [444, 423],
    [444, 469],
    [399, 469],
  ]),
  {
    id: "woolworths",
    name: "Woolworths",
    category: "Department Store",
    point: p(399, 430),
    label: p(421.5, 444),
  },
);
addUnit(box(170, 504, 146, 43), {
  id: "checkers",
  name: "Checkers Hyper",
  category: "Food Market",
  point: p(240, 504),
  label: p(241, 524),
});
addUnit(box(379, 501, 49, 20), {
  id: "clicks",
  name: "Clicks",
  category: "Health & Beauty",
  point: p(379, 511),
  label: p(404, 511),
});

// Fictional testing layer. Stable unit IDs keep saved places and route approaches intact.
const conceptTenants = [
  ["unit-s001", "Nook", "Home & Living"],
  ["unit-s016", "Paper & Pine", "Books & Stationery"],
  ["unit-s026", "Juniper Cafe", "Dining & Coffee"],
  ["unit-s027", "Petal Studio", "Flowers & Gifts"],
  ["unit-s036", "Market Hall", "Dining & Food"],
  ["unit-s067", "Orbit", "Electronics"],
  ["unit-s068", "Forma", "Fashion & Clothing"],
  ["unit-s104", "Olive Table", "Dining & Restaurant"],
];
for (const [id, name, category] of conceptTenants) {
  const room = rooms.find((item) => item.id === id)!;
  const place = directory.find((item) => item.id === id)!;
  Object.assign(room, { name, category, demo: true, labelMode: "always" });
  Object.assign(place, {
    name,
    category,
    demo: true,
    openingStatus: "Fictional demo tenant",
    description: `${name}: a fictional tenant for visual testing.`,
    entranceInfo:
      "Demo gallery approach. Entrance is illustrative.",
  });
}

const floor: IndoorFloor = {
  id: "sandton-reference",
  level: 1,
  name: "Reference level",
  shortLabel: "D",
  bounds: { width: 1242, height: 1306 },
  plate: path([
    [130, 104],
    [161, 104],
    [161, 130],
    [326, 130],
    [346, 179],
    [373, 179],
    [389, 198],
    [400, 253],
    [445, 253],
    [445, 404],
    [454, 404],
    [454, 547],
    [170, 547],
    [170, 504],
    [145, 504],
    [129, 488],
    [129, 417],
    [130, 403],
  ]),
  overviewPoints: path([
    [89, 32],
    [511, 637],
  ]),
  siteBoundary: path([
    [116, 46],
    [471, 185],
    [498, 248],
    [489, 594],
    [453, 625],
    [115, 567],
    [105, 425],
    [105, 78],
  ]),
  contextRoad:
    "M 232 92 L 942 370 Q 958 376 995 496 L 978 1170 Q 955 1234 904 1250 L 230 1134 Q 208 846 210 156 Q 208 112 232 92 Z",
  contextLabels: [
    { id: "rivonia", text: "Rivonia Rd", point: p(306, 117), rotate: 22 },
    { id: "fifth", text: "5th St", point: p(106, 295), rotate: -90 },
    { id: "sandton", text: "Sandton Dr", point: p(489, 404), rotate: -88 },
    { id: "alice", text: "Alice Ln", point: p(282, 593), rotate: 10 },
  ],
  concourses: [],
  corridorPaths,
  rooms,
  facilities: [],
  courts: [{ point: p(354, 216), radius: 48 }],
  labels: [
    {
      id: "west-gallery",
      text: "West gallery",
      point: p(216, 310),
      rotate: -90,
    },
    {
      id: "east-gallery",
      text: "East gallery",
      point: p(367, 350),
      rotate: -90,
    },
  ],
};
const anchorIds = ["checkers", "edgars", "woolworths", "mr-price", "clicks"];
const start = p(173, 450);
directory.push({
  id: "west-start",
  name: "West demo entrance",
  category: "Map landmark",
  floorLevel: 1,
  floorName: floor.name,
  point: start,
  distanceM: 0,
  walkTimeMin: 0,
  openingStatus: "Demo start",
  entranceInfo:
    "Demo origin beside the red marker in the supplied schematic. Entrance position is illustrative.",
});
export const samplePOIs = directory.sort(
  (a, b) =>
    (anchorIds.indexOf(a.id) < 0 ? 999 : anchorIds.indexOf(a.id)) -
    (anchorIds.indexOf(b.id) < 0 ? 999 : anchorIds.indexOf(b.id)),
);
export const atlasSandtonVenue: IndoorMapData = {
  venueName: "Sandton Mall",
  floors: [floor],
  start,
  startFloorLevel: 1,
  destination: samplePOIs.find((poi) => poi.id === "checkers")!,
  route: [],
  steps: [],
};
export const namedStoreCount = anchorIds.length;
export const mapUnitCount = rooms.length;
export const venueSubtitle = "Reference schematic · Demo routes";
export const searchCategories = [
  { id: "all", label: "All places", icon: "compass" },
  { id: "anchors", label: "Named stores", icon: "shop" },
  { id: "units", label: "Other units", icon: "layers" },
  { id: "landmarks", label: "Map points", icon: "pin" },
];
