const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const sourceRoot = path.resolve(__dirname, "../src");
// Compile only this app's pure TypeScript fixtures and routing module for Node.
require.extensions[".ts"] = (module, filename) => {
  assert.ok(filename.startsWith(sourceRoot + path.sep));
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(compiled.outputText, filename);
};
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
      `You’re at ${poi.name}`,
    );
    assert.equal(
      route.steps[route.steps.length - 1].floorLevel,
      poi.floorLevel,
    );
    assert.ok(route.distanceM > 0 && route.walkTimeMin >= 1);
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
const zara = samplePOIs.find((p) => p.id === "zara");
assert.equal(buildDemoRoute(zara).segments[0].transitionType, "escalator");
assert.equal(buildDemoRoute(zara, true).segments[0].transitionType, "lift");
assert.notDeepEqual(
  buildDemoRoute(zara).segments[0].polyline,
  buildDemoRoute(zara, true).segments[0].polyline,
);
assert.equal(buildDemoRoute({ ...zara, floorLevel: 999 }), null);
console.log(
  `Verified ${samplePOIs.length * 2} destination/preference routes, floor changes, exact endpoints and unreachable-floor handling.`,
);
