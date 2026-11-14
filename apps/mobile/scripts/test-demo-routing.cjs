const assert = require("node:assert/strict");
require("./register-test-typescript.cjs");
const { buildDemoRoute, floorName } = require("../src/map/demo-routing.ts");
const { samplePOIs, atlasSandtonVenue } = require("../src/fixtures.ts");
for (const poi of samplePOIs)
  for (const stepFree of [false, true]) {
    assert.equal(poi.floorName, floorName(poi.floorLevel));
    const route = buildDemoRoute(poi, stepFree);
    assert.ok(route, `${poi.id}: reachable`);
    assert.deepEqual(route.segments[0].polyline[0], atlasSandtonVenue.start);
    const end = route.segments[route.segments.length - 1];
    assert.equal(end.floorLevel, poi.floorLevel);
    assert.deepEqual(end.polyline[end.polyline.length - 1], poi.point);
    assert.equal(
      route.steps[route.steps.length - 1].instruction,
      poi.id.startsWith("unit-")
        ? `Approach to ${poi.name}`
        : `You’re at ${poi.name}`,
    );
    assert.equal(
      route.steps[route.steps.length - 1].floorLevel,
      poi.floorLevel,
    );
    assert.ok(route.distanceM >= 0 && route.walkTimeMin >= 1);
    assert.equal(route.segments.length, poi.floorLevel === 1 ? 1 : 2);
    if (stepFree)
      assert.ok(
        route.segments.every(
          (s) => !s.transitionAt || s.transitionType === "lift",
        ),
      );
    for (const segment of route.segments) {
      assert.ok(
        segment.polyline.every(
          (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
        ),
      );
      assert.equal(
        floorName(segment.floorLevel),
        atlasSandtonVenue.floors.find((f) => f.level === segment.floorLevel)
          .name,
      );
    }
  }
const edgars = samplePOIs.find((p) => p.id === "edgars");
assert.equal(buildDemoRoute(edgars).segments[0].transitionType, undefined);
assert.equal(
  buildDemoRoute(edgars, true).segments[0].transitionType,
  undefined,
);
assert.deepEqual(
  buildDemoRoute(edgars).segments[0].polyline,
  buildDemoRoute(edgars, true).segments[0].polyline,
);
assert.equal(buildDemoRoute({ ...edgars, floorLevel: 999 }), null);
console.log(
  `Verified ${samplePOIs.length * 2} schematic routes, single-level consistency, exact endpoints and unreachable-floor handling.`,
);
