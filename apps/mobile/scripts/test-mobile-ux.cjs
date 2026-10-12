// Installs the existing pure-TypeScript loader and checks all 18 demo routes.
require("./test-demo-routing.cjs");
const assert = require("node:assert/strict");
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
  const points = cameraPoints("follow", floor, route, position, next);
  assert.ok(points.some((p) => p === position));
  if (next) assert.ok(points.some((p) => p === next));
  assert.ok(
    Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)) >=
      110,
  );
  assert.ok(
    Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y)) >=
      130,
  );
  assert.ok(points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
}
console.log(
  "Place memory: recovery, pruning, deduplication, recency, saves and clear-history passed.",
);
console.log(
  "Camera: floor/route/follow/manual modes and minimum leg context passed.",
);
