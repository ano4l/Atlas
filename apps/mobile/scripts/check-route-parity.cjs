const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
require("./register-test-typescript.cjs");
const { PlatformApiClient, PlatformApiError } = require("@atlas/api-client");
const { createConnectedVenue } = require("../src/map/connected-venue.ts");
const { createOfflinePlanner } = require("../src/map/offline-venue.ts");

function comparableRoute(route) {
  return {
    mapVersionId: route.mapVersionId,
    distanceM: route.distanceM,
    estimatedTimeS: route.estimatedTimeS,
    validUntilMs: route.validUntilMs ?? null,
    floors: route.floors.map(({ floorId, polyline }) => ({ floorId, polyline })),
    transitions: route.transitions.map(({ fromFloorId, toFloorId, transitionType }) =>
      ({ fromFloorId, toFloorId, transitionType })),
  };
}

async function checkRouteParity(client, venueId, onTiming = () => {}) {
  const pkg = await client.getMapPackage(venueId);
  assert.equal(pkg.venue.id, venueId);
  const venue = createConnectedVenue(pkg);
  const planOffline = createOfflinePlanner(pkg);
  assert.ok(planOffline, "Published package must be usable offline");
  assert.ok(venue.places.length, "Published package must have destinations to test");
  const now = Date.now();
  const counts = { starts: venue.starts.length, destinations: venue.places.length, routes: 0, unavailable: 0 };
  for (const start of venue.starts) {
    for (const destination of venue.places) {
      for (const mode of ["shortest", "step_free"]) {
        const request = {
          mapVersionId: venue.mapVersionId, start: start.coordinates, destinationPoiId: destination.id, mode,
        };
        const label = `${start.id} → ${destination.name} (${mode})`;
        const offlineStarted = performance.now();
        const offline = planOffline(request, now);
        const offlineMs = performance.now() - offlineStarted;
        const onlineStarted = performance.now();
        let online;
        try {
          online = await client.calculateRoute(venueId, request);
        } catch (error) {
          if (!(error instanceof PlatformApiError) || error.status !== 400) throw error;
          assert.equal(offline, null, `${label}: API rejected a route that offline routing accepted`);
          onTiming({ offlineMs, onlineMs: performance.now() - onlineStarted });
          counts.unavailable++;
          continue;
        }
        assert.ok(offline, `${label}: API found a route that offline routing could not find`);
        onTiming({ offlineMs, onlineMs: performance.now() - onlineStarted });
        assert.deepEqual(comparableRoute(online), comparableRoute(offline), label);
        venue.routeSegments(online, start.point, start.coordinates.floorId, destination, mode === "step_free");
        counts.routes++;
      }
    }
  }
  assert.ok(counts.routes > 0, "Expected at least one successful route");
  const latest = await client.getMapPackage(venueId);
  assert.equal(latest.mapVersion.id, pkg.mapVersion.id, "Published version changed during the parity check");
  const edgeStates = (value) => value.graph.edges.map(({ id, closureState, validFrom, validUntil }) =>
    [id, closureState, validFrom, validUntil]).sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(edgeStates(latest), edgeStates(pkg), "Edge availability changed during the parity check");
  return counts;
}

module.exports = { checkRouteParity };

function summarizeTiming(samples) {
  const sorted = samples.toSorted((a, b) => a - b);
  const percentile = (fraction) => Number(sorted[Math.ceil(sorted.length * fraction) - 1].toFixed(2));
  return { samples: sorted.length, p50Ms: percentile(0.5), p95Ms: percentile(0.95) };
}

if (require.main === module) {
  const [, , baseUrl, venueId, expectation] = process.argv;
  if (!baseUrl || !venueId) {
    console.error("Usage: node apps/mobile/scripts/check-route-parity.cjs <api-base-url> <venue-id> [--expect-unavailable]");
    process.exitCode = 1;
  } else {
    const timings = [];
    checkRouteParity(new PlatformApiClient({ baseUrl }), venueId, (sample) => timings.push(sample)).then((counts) => {
      if (expectation === "--expect-unavailable") {
        assert.ok(counts.unavailable > 0, "Expected the fixture to have an unavailable route");
      }
      if (expectation === "--expect-all-routable") {
        assert.equal(counts.unavailable, 0, "Expected all entrance-to-destination routes to be available");
      }
      console.log(JSON.stringify({
        ...counts,
        offlineComputation: summarizeTiming(timings.map((sample) => sample.offlineMs)),
        apiRoundTrip: summarizeTiming(timings.map((sample) => sample.onlineMs)),
      }));
    }).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
