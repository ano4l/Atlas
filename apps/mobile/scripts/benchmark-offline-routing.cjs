const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { arch, cpus, platform, release } = require("node:os");
const { performance } = require("node:perf_hooks");
require("./register-test-typescript.cjs");
const { isMapPackage } = require("@atlas/api-client");
const { createConnectedVenue } = require("../src/map/connected-venue.ts");
const { createOfflinePlanner, encodeVenueSnapshot, readVenueSnapshot } = require("../src/map/offline-venue.ts");

function summarize(samples) {
  const sorted = samples.toSorted((a, b) => a - b);
  const percentile = (fraction) => Number(sorted[Math.ceil(sorted.length * fraction) - 1].toFixed(4));
  return { samples: sorted.length, p50Ms: percentile(0.5), p95Ms: percentile(0.95) };
}

function measure(pkg, iterations, now) {
  const venue = createConnectedVenue(pkg);
  const route = createOfflinePlanner(pkg);
  assert.ok(route, "Map is unusable offline");
  const requests = venue.starts.flatMap((start) => venue.places.flatMap((place) =>
    ["shortest", "step_free"].map((mode) => ({
      mapVersionId: venue.mapVersionId, start: start.coordinates, destinationPoiId: place.id, mode,
    }))));
  assert.ok(requests.length, "Map has no route requests to benchmark");
  const snapshot = encodeVenueSnapshot(pkg, now);
  assert.ok(readVenueSnapshot(snapshot, pkg.venue.slug, now));
  const available = requests.map((request) => Boolean(route(request, now)));
  assert.ok(available.some(Boolean), "Map has no routable destinations");
  const routeTimes = { shortest: [], step_free: [] };
  const snapshotTimes = [];
  for (let iteration = 0; iteration < iterations; iteration++) {
    const snapshotStarted = performance.now();
    const restored = readVenueSnapshot(snapshot, pkg.venue.slug, now);
    snapshotTimes.push(performance.now() - snapshotStarted);
    assert.equal(restored?.pkg.mapVersion.id, venue.mapVersionId);
    for (const [index, request] of requests.entries()) {
      const started = performance.now();
      const result = route(request, now);
      routeTimes[request.mode].push(performance.now() - started);
      assert.equal(Boolean(result), available[index], "Route availability changed within the benchmark");
    }
  }
  return {
    fixture: {
      venue: pkg.venue.slug, mapVersionId: venue.mapVersionId, floors: pkg.floors.length,
      nodes: pkg.graph.nodes.length, edges: pkg.graph.edges.length, entrances: venue.starts.length,
      destinations: venue.places.length, snapshotBytes: Buffer.byteLength(snapshot),
    },
    iterations,
    successfulPerIteration: available.filter(Boolean).length,
    unavailablePerIteration: available.filter((value) => !value).length,
    snapshotDecodeAndValidation: summarize(snapshotTimes),
    shortest: summarize(routeTimes.shortest),
    stepFree: summarize(routeTimes.step_free),
  };
}

try {
  const [, , path, count = "30"] = process.argv;
  const iterations = Number(count);
  if (!path || !/^\d+$/.test(count) || iterations < 1 || iterations > 500 || process.argv.length > 4) {
    throw new Error("Usage: node apps/mobile/scripts/benchmark-offline-routing.cjs <published-map.json> [iterations: 1–500]");
  }
  const bytes = readFileSync(path);
  const pkg = JSON.parse(bytes);
  assert.ok(isMapPackage(pkg), "Expected a published consumer map package");
  // Pin time for repeatable closure and validity-window comparisons.
  const now = Date.parse(process.env.ATLAS_BENCHMARK_AT ?? "2026-11-13T00:00:00.000Z");
  assert.ok(Number.isFinite(now), "ATLAS_BENCHMARK_AT must be a valid date");
  console.log(JSON.stringify({
    node: process.version, host: `${platform()} ${release()} ${arch()}`, cpu: cpus()[0]?.model,
    packageSha256: createHash("sha256").update(bytes).digest("hex"),
    evaluatedAt: new Date(now).toISOString(),
    ...measure(pkg, iterations, now),
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
