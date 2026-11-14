// The existing route suite installs the app-only TypeScript loader before this file.
const assert = require("node:assert/strict");
const {
  atlasSandtonVenue,
  samplePOIs,
  mapUnitCount,
} = require("../src/fixtures.ts");
const { buildDemoRoute } = require("../src/map/demo-routing.ts");
const { cameraPoints } = require("../src/map/camera.ts");
const {
  fitCamera,
  hitTestPlace,
  mapExtent,
  panLimits,
  pointInPolygon,
  zoomAt,
  MIN_ZOOM,
  MAX_ZOOM,
  storeNameLines,
} = require("../src/map/viewport.ts");

const ids = new Set();
let stores = 0;
for (const floor of atlasSandtonVenue.floors) {
  for (const room of floor.rooms) {
    stores++;
    assert.ok(!ids.has(room.id), `Unique store identity: ${room.id}`);
    ids.add(room.id);
    const poi = samplePOIs.find((p) => p.id === room.id);
    assert.ok(poi, `${room.name} has a directory entry`);
    assert.equal(poi.name, room.name);
    assert.equal(poi.floorLevel, floor.level);
    assert.ok(
      pointInPolygon(room.label, room.points),
      `${room.name} label inside its unit`,
    );
    assert.equal(
      storeNameLines(room.name).join(" "),
      room.name,
      "Wrapping never drops a word",
    );
    assert.ok(Number.isFinite(poi.point.x) && Number.isFinite(poi.point.y));
    for (const scale of [0.3, 0.5, 1, 2.4])
      assert.equal(
        hitTestPlace(room.label, floor, samplePOIs, scale).id,
        room.id,
        "Store shapes win over nearby destination points",
      );
    for (const stepFree of [false, true]) {
      const route = buildDemoRoute(poi, stepFree);
      for (const segment of route.segments) {
        const local = atlasSandtonVenue.floors.find(
          (f) => f.level === segment.floorLevel,
        );
        for (let i = 1; i < segment.polyline.length; i++) {
          const a = segment.polyline[i - 1],
            b = segment.polyline[i];
          const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          assert.ok(
            !local.rooms.some((r) => pointInPolygon(middle, r.points)),
            `${poi.name} route stays outside store interiors`,
          );
        }
      }
    }
  }
  assert.equal(
    hitTestPlace({ x: -200, y: -200 }, floor, samplePOIs, 0.5),
    undefined,
  );
}
assert.equal(stores, mapUnitCount);
const close = (a, b) => assert.ok(Math.abs(a - b) < 0.000001, `${a} ≈ ${b}`);
for (const start of [
  { x: -120, y: 83, scale: 0.4 },
  { x: 30, y: -170, scale: 1.2 },
]) {
  for (const focal of [
    { x: 195, y: 360 },
    { x: 14, y: 88 },
  ]) {
    for (const target of [0.1, 0.5, 1.7, 9]) {
      const camera = zoomAt(start, focal, target);
      assert.ok(camera.scale >= MIN_ZOOM && camera.scale <= MAX_ZOOM);
      close(
        (focal.x - start.x) / start.scale,
        (focal.x - camera.x) / camera.scale,
      );
      close(
        (focal.y - start.y) / start.scale,
        (focal.y - camera.y) / camera.scale,
      );
    }
  }
}
for (const width of [320, 390, 768]) {
  const viewport = { width, height: 760, top: 128, bottom: 250 };
  const camera = fitCamera(atlasSandtonVenue.floors[0].plate, viewport);
  assert.ok(Number.isFinite(camera.x) && Number.isFinite(camera.y));
  const points = atlasSandtonVenue.floors[0].plate;
  const centreX =
    (Math.min(...points.map((p) => p.x)) +
      Math.max(...points.map((p) => p.x))) /
    2;
  const centreY =
    (Math.min(...points.map((p) => p.y)) +
      Math.max(...points.map((p) => p.y))) /
    2;
  close(centreX * camera.scale + camera.x, width / 2);
  close(
    centreY * camera.scale + camera.y,
    viewport.top + (viewport.height - viewport.top - viewport.bottom) / 2,
  );
}
const anchorRoute = buildDemoRoute(samplePOIs.find((p) => p.id === "edgars"));
const follow = fitCamera(
  cameraPoints(
    "follow",
    atlasSandtonVenue.floors[0].plate,
    [],
    { x: 400, y: 491 },
    { x: 360, y: 491 },
  ),
  { width: 390, height: 760, top: 128, bottom: 250, right: 76 },
);
for (const labelX of [182.5, 537.5]) {
  const screenX = labelX * follow.scale + follow.x;
  assert.ok(
    screenX > 24 && screenX < 390 - 76,
    "Short-leg following keeps both rows of store names in view",
  );
}
const padded = fitCamera(
  [
    { x: 80, y: 120 },
    { x: 435, y: 491 },
  ],
  { width: 390, height: 760, top: 128, bottom: 250, right: 76 },
);
assert.ok(
  435 * padded.scale + padded.x < 390 - 76,
  "Route endpoint stays left of the controls rail",
);
const compact = { width: 320, height: 620, top: 142, bottom: 282 };
const plate = atlasSandtonVenue.floors[0].plate;
const extent = mapExtent(plate);
const overview = fitCamera(plate, compact);
assert.ok(extent.top * overview.scale + overview.y > compact.top);
assert.ok(
  extent.bottom * overview.scale + overview.y < compact.height - compact.bottom,
);
const panning = panLimits(compact, extent, overview.scale);
assert.ok(extent.bottom * overview.scale + panning.minY > compact.top);
assert.ok(
  extent.top * overview.scale + panning.maxY < compact.height - compact.bottom,
);
assert.ok(anchorRoute.steps.some((s) => s.icon === "turn-left"));
assert.ok(anchorRoute.steps.some((s) => s.icon === "turn-right"));
console.log(
  "Custom map: traced unit identities, gallery approaches, unobstructed routes, selection, anchored zoom and panel-aware framing passed.",
);
