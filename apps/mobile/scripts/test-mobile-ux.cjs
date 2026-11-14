// Installs the pure-TypeScript loader and checks the schematic demo routes.
require("./test-demo-routing.cjs");
require("./test-map-viewport.cjs");
require("./test-connected-venue.cjs");
const assert = require("node:assert/strict");
const { PlatformApiError, PlatformNetworkError } = require("@atlas/api-client");
const { createNavigationDiagnostics, DIAGNOSTIC_LIMIT } = require("../src/map/navigation-diagnostics.ts");
let now = 1000;
const diagnostics = createNavigationDiagnostics(() => now);
diagnostics.record("map", "failed");
assert.equal(diagnostics.exportReport(), null);
diagnostics.start();
for (let index = 0; index < DIAGNOSTIC_LIMIT; index++) {
  diagnostics.record("search", "failed", new Error("private search text"));
}
now += 2000;
diagnostics.record("reroute", "using-saved-map", new PlatformApiError(503, "fixture-ref"));
diagnostics.record("route", "failed", new PlatformNetworkError("private network error"));
diagnostics.stop();
diagnostics.record("map", "failed");
const report = diagnostics.exportReport();
assert.doesNotMatch(report, /private/);
const { schemaVersion, entries } = JSON.parse(report);
assert.equal(schemaVersion, 1);
assert.equal(entries.length, DIAGNOSTIC_LIMIT);
assert.deepEqual(entries.at(-2), {
  operation: "reroute", outcome: "using-saved-map", elapsedSeconds: 2, cause: "http", status: 503, requestId: "fixture-ref",
});
assert.equal(entries.at(-1).cause, "network");
diagnostics.clear();
assert.equal(diagnostics.exportReport(), null);
assert.equal(diagnostics.getSnapshot().recording, false);
diagnostics.start();
diagnostics.record("map", "failed");
now += 30 * 60 * 1000;
assert.equal(diagnostics.exportReport(), null);
assert.equal(diagnostics.getSnapshot().recording, false);
console.log("Navigation diagnostics: opt-in, report cap, safe fields, stop, clear and expiry passed.");

const { readAcceleration, readDeviceMotion, readPressure } = require("../src/positioning/native-readings.ts");
const linear = { x: 2, y: 0, z: 0, timestamp: 1 };
const total = { x: 2 - 9.80665, y: 0, z: 0, timestamp: 1.01 };
assert.equal(readDeviceMotion({ acceleration: linear, accelerationIncludingGravity: total }).verticalAccelerationMps2, 2);
assert.equal(readDeviceMotion({ acceleration: { ...linear, timestamp: 0.8 }, accelerationIncludingGravity: total }).verticalAccelerationMps2, undefined);
assert.equal(readDeviceMotion({ acceleration: linear, accelerationIncludingGravity: { ...total, x: 2 } }).verticalAccelerationMps2, undefined);
assert.equal(readDeviceMotion({ accelerationIncludingGravity: null }), null);
assert.deepEqual(readAcceleration({ x: 0, y: 1, z: -1, timestamp: 120.5 }), {
  kind: "motion", accelerationX: 0, accelerationY: 9.80665, accelerationZ: -9.80665,
  sensorTimestampSeconds: 120.5,
});
assert.equal(readAcceleration({ x: NaN, y: 1, z: 0, timestamp: 0 }), null);
assert.deepEqual(readPressure({ pressure: 1013, timestamp: 120.5 }), {
  kind: "pressure", hectopascals: 1013, sensorTimestampSeconds: 120.5,
});
assert.equal(readPressure({ pressure: 0, timestamp: 120.5 }), null);
const {
  parsePlaceMemory,
  rememberPlace,
  toggleSavedPlace,
} = require("../src/map/place-memory.ts");
const { cameraPoints } = require("../src/map/camera.ts");
const ids = ["a", "b", "c", "d", "e", "f"];
for (const raw of [null, "{broken", "null", "42", "[]"]) {
  assert.deepEqual(parsePlaceMemory(raw, ids), { saved: [], recent: [] });
}
let memory = parsePlaceMemory(
  JSON.stringify({
    saved: ["a", "missing", "a", 7, "b"],
    recent: ["c", "c", "missing", "a"],
  }),
  ids,
);
assert.deepEqual(memory, { saved: ["a", "b"], recent: ["c", "a"] });
memory = rememberPlace(memory, "a");
assert.deepEqual(memory.recent, ["a", "c"]);
for (const id of ids) memory = rememberPlace(memory, id);
assert.deepEqual(memory.recent, ["f", "e", "d", "c", "b"]);
memory = toggleSavedPlace(memory, "a");
assert.deepEqual(memory.saved, ["b"]);
memory = toggleSavedPlace(memory, "f");
assert.deepEqual(memory.saved, ["b", "f"]);
const cleared = { ...memory, recent: [] };
assert.deepEqual(parsePlaceMemory(JSON.stringify(cleared), ids), cleared);
assert.deepEqual(
  cleared.saved,
  memory.saved,
  "Clearing history preserves saved places",
);
const floor = [
  { x: 0, y: 0 },
  { x: 380, y: 550 },
];
const route = [
  { x: 40, y: 90 },
  { x: 60, y: 100 },
];
const position = { x: 40, y: 90 };
assert.deepEqual(cameraPoints("floor", floor, route, position), floor);
assert.deepEqual(cameraPoints("route", floor, route, position), route);
assert.deepEqual(cameraPoints("route", floor, undefined, position), floor);
assert.deepEqual(cameraPoints("manual", floor, route, position), []);
for (const next of [undefined, { x: 41, y: 91 }, { x: 240, y: 300 }]) {
  const [topLeft, bottomRight] = cameraPoints(
    "follow",
    floor,
    route,
    position,
    next,
  );
  assert.equal(bottomRight.x - topLeft.x, 380);
  assert.equal(bottomRight.y - topLeft.y, 320);
  const lead = Math.hypot(
    (topLeft.x + bottomRight.x) / 2 - position.x,
    (topLeft.y + bottomRight.y) / 2 - position.y,
  );
  assert.ok(lead <= 20.00001, "The route cannot pull the view off the user");
  assert.equal(lead > 0, Boolean(next));
}
console.log(
  "Place memory: recovery, pruning, deduplication, recency, saves and clear-history passed.",
);
console.log(
  "Camera: floor/route/follow/manual modes and minimum leg context passed.",
);
