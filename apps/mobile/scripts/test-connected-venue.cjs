const assert = require("node:assert/strict");
const { mkdtemp, readFile, rename, rm, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { getPlatformRequestId, PlatformApiClient, PlatformApiError } = require("../../../packages/api-client/src/index.ts");
const { createConnectedVenue } = require("../src/map/connected-venue.ts");
const { createVenueCache } = require("../src/map/venue-cache.ts");
const { loadPublishedVenue } = require("../src/map/load-venue.ts");
const { hasExpired, nextEdgeAvailabilityChange } = require("../src/map/edge-availability.ts");
const { checkRouteParity } = require("./check-route-parity.cjs");
const { encodeCheckpoint, resolveCheckpoint } = require("../src/map/checkpoint.ts");
const { renderCheckpointSheet } = require("./print-checkpoints.cjs");
const { createRouteReplay, createWalkSample } = require("../src/map/guidance-replay.ts");
const { findSimulatedDetour, requestReroute } = require("../src/map/reroute.ts");
const { createRouteProgress } = require("@atlas/positioning-core");
const { createOfflinePlanner, encodeVenueSnapshot, isUnavailable, readVenueSnapshot, searchCachedVenue } = require("../src/map/offline-venue.ts");

const fixture = {
  venue: { id: "venue", slug: "atlas-synthetic-mall", name: "Fictional venue" },
  mapVersion: { id: "v1", version: 1, status: "published" },
  floors: [
    { id: "g", ordinal: 0, name: "Ground floor", localBounds: "[10,20,100,60]" },
    { id: "l1", ordinal: 1, name: "Level one", localBounds: [0, 0, 100, 60] },
  ],
  pois: [{ id: "poi", floorId: "l1", name: "Juniper & Co", entryPointNodeId: "door", status: "open", aliases: '["coffee bar"]' }],
  graph: {
    nodes: [
      { id: "start", floorId: "g", nodeType: "entrance", x: 12, y: 30 },
      { id: "lift-g", floorId: "g", nodeType: "transition", x: 30, y: 30 },
      { id: "lift-l1", floorId: "l1", nodeType: "transition", x: 30, y: 30 },
      { id: "door", floorId: "l1", nodeType: "entrance", x: 50, y: 30 },
    ],
    edges: [
      { id: "e1", fromNodeId: "start", toNodeId: "lift-g", edgeType: "corridor",
        isRestricted: false, closureState: "open", geometry: '{"type":"LineString","coordinates":[[12,30],[30,30]]}' },
      { id: "e2", fromNodeId: "lift-g", toNodeId: "lift-l1", edgeType: "lift",
        isRestricted: false, closureState: "open" },
      { id: "e3", fromNodeId: "lift-l1", toNodeId: "door", edgeType: "corridor",
        isRestricted: false, closureState: "open" },
    ],
  },
};
fixture.graph.edges.forEach((edge) => Object.assign(edge, {
  baseCostM: 5, isOneWay: false, validFrom: null, validUntil: null, isStepFree: true,
}));
const route = {
  mapVersionId: "v1", distanceM: 38, estimatedTimeS: 32,
  floors: [
    { floorId: "g", polyline: [[12, 30], [30, 30]] },
    { floorId: "l1", polyline: [[30, 30], [50, 30]] },
  ],
  transitions: [{ fromFloorId: "g", toFloorId: "l1", transitionType: "lift" }],
};

async function verify() {
  const client = new PlatformApiClient({
    baseUrl: "http://atlas.test/",
    fetchImpl: async (input, request) => {
      const url = new URL(input);
      if (url.pathname === "/v1/venues") return Response.json([fixture.venue]);
      if (url.pathname.endsWith("/map-package")) return Response.json(fixture);
      if (url.pathname.endsWith("/search")) {
        assert.equal(url.searchParams.get("q"), "Juniper & Co");
        assert.equal(url.searchParams.get("mapVersionId"), "v1");
        return Response.json({ results: [{ poiId: "poi" }] });
      }
      assert.equal(url.pathname, "/v1/venues/venue/routes");
      assert.equal(request.method, "POST");
      assert.deepEqual(JSON.parse(request.body), {
        mapVersionId: "v1", start: { floorId: "g", x: 12, y: 30 }, destinationPoiId: "poi",
      });
      return Response.json(route);
    },
  });
  const venues = await client.listVenues();
  const loaded = createConnectedVenue(await client.getMapPackage(venues[0].id));
  const offlineForFixture = createOfflinePlanner(fixture);
  const curved = structuredClone(fixture);
  const curvedPoints = [[12, 30], [12, 36], [30, 36], [30, 30]];
  curved.graph.edges[0].geometry = JSON.stringify({ type: "LineString", coordinates: curvedPoints });
  assert.deepEqual(createConnectedVenue(curved).floors[0].walkways[0],
    curvedPoints.map(([x, y]) => ({ x: (x - 10) * 2, y: (y - 20) * 2 })));
  curved.pois.push({ id: "west", floorId: "g", name: "West entrance", entryPointNodeId: "start", status: "open" });
  const forward = { mapVersionId: "v1", start: { floorId: "g", x: 12, y: 30 }, destinationPoiId: "poi", mode: "step_free" };
  const reverse = { ...forward, start: { floorId: "g", x: 30, y: 30 }, destinationPoiId: "west" };
  const planCurve = createOfflinePlanner(curved);
  const curvedRoute = planCurve(forward, Date.now());
  assert.deepEqual(curvedRoute.floors[0].polyline, curvedPoints);
  assert.equal(curvedRoute.distanceM, 50);
  assert.equal(curvedRoute.estimatedTimeS, 41);
  const replayCurve = createRouteReplay(curvedRoute, "venue");
  const curveProgress = createRouteProgress("venue", curvedRoute.floors);
  assert.deepEqual(curveProgress.update(replayCurve(0, 0, 0), 0).nextTurn, { direction: "left", distanceM: 6 });
  const onBend = replayCurve(0, 6000, 6000);
  assert.deepEqual([onBend.x, onBend.y], [18, 36]);
  assert.deepEqual(planCurve(reverse, Date.now()).floors[0].polyline, curvedPoints.slice().reverse());
  for (const geometry of ["{", [[0, 0], [12, 36], [30, 30]], [[12, 30], ["12", 36], [30, 30]]]) {
    curved.graph.edges[0].geometry = geometry;
    assert.deepEqual(createOfflinePlanner(curved)(forward, Date.now()), { ...route, estimatedTimeS: 31 });
  }
  const parityClient = {
    getMapPackage: async () => fixture,
    calculateRoute: async (_venueId, request) => ({
      ...offlineForFixture(request, Date.now()), routeId: "server-only",
    }),
  };
  assert.deepEqual(await checkRouteParity(parityClient, fixture.venue.id), {
    starts: 1, destinations: 1, routes: 2, unavailable: 0,
  });
  await assert.rejects(checkRouteParity({
    ...parityClient,
    calculateRoute: async (venueId, request) => ({
      ...await parityClient.calculateRoute(venueId, request), distanceM: 999,
    }),
  }, fixture.venue.id), /shortest/);
  const partiallyAccessible = structuredClone(fixture);
  partiallyAccessible.graph.edges[1].isStepFree = false;
  const planPartial = createOfflinePlanner(partiallyAccessible);
  assert.deepEqual(await checkRouteParity({
    getMapPackage: async () => partiallyAccessible,
    calculateRoute: async (_venueId, request) => {
      const route = planPartial(request, Date.now());
      if (!route) throw new PlatformApiError(400);
      return route;
    },
  }, fixture.venue.id), {
    starts: 1, destinations: 1, routes: 1, unavailable: 1,
  });
  const code = encodeCheckpoint(loaded, loaded.starts[0]);
  assert.equal(code, "ATLAS1:venue:v1:start");
  assert.equal(resolveCheckpoint(loaded, code), loaded.starts[0]);
  for (const invalid of [
    "", "https://atlas.test", "ATLAS2:venue:v1:start", "ATLAS1:elsewhere:v1:start",
    "ATLAS1:venue:v2:start", "ATLAS1:venue:v1:door", "ATLAS1:venue:v1:lift-g",
    code + "\n", code + ":12:30", "a".repeat(202),
  ]) assert.equal(resolveCheckpoint(loaded, invalid), null);
  assert.throws(() => encodeCheckpoint(loaded, { ...loaded.starts[0], id: "door" }), /Invalid checkpoint/);
  const twoFloorPackage = {
    ...fixture, venue: { ...fixture.venue, name: "Fictional <venue>" },
    graph: { ...fixture.graph, nodes: [
      ...fixture.graph.nodes,
      { id: "upper-start", floorId: "l1", nodeType: "entrance", x: 12, y: 30 },
    ] },
  };
  const twoFloorVenue = createConnectedVenue(twoFloorPackage);
  const upperStart = resolveCheckpoint(twoFloorVenue, encodeCheckpoint(twoFloorVenue, twoFloorVenue.starts[1]));
  assert.deepEqual(upperStart.coordinates, { floorId: "l1", x: 12, y: 30 });
  const sheet = await renderCheckpointSheet(twoFloorPackage);
  assert.match(sheet, /Fictional &lt;venue&gt;/);
  assert.match(sheet, /Ground floor · Entrance 1/);
  assert.match(sheet, /Level one · Entrance 2/);
  assert.equal((sheet.match(/<svg\b/g) ?? []).length, twoFloorVenue.starts.length);
  console.log("Checkpoints: round-trip, rejection and printable QR sheet passed.");
  const { results } = await client.search(loaded.venueId, loaded.mapVersionId, "Juniper & Co");
  const destination = loaded.places.find((place) => place.id === results[0].poiId);
  const [start] = loaded.starts;
  assert.equal(loaded.starts.length, 1, "Shop doors must not appear as public starts");
  assert.deepEqual(start.point, { x: 4, y: 20 });
  assert.deepEqual(loaded.floors[0].walkways[0], [start.point, { x: 40, y: 20 }]);
  assert.equal(loaded.floors[0].facilities[0].kind, "lift");
  const response = await client.calculateRoute(loaded.venueId, {
    mapVersionId: loaded.mapVersionId, start: start.coordinates, destinationPoiId: destination.id,
  });
  const segments = loaded.routeSegments(response, start.point, start.coordinates.floorId, destination);
  assert.deepEqual(offlineForFixture({
    mapVersionId: "v1", start: { floorId: "g", x: 13, y: 31 }, destinationPoiId: "poi",
  }, Date.now()).floors[0].polyline[0], [12, 30]);
  assert.equal(offlineForFixture({
    mapVersionId: "v1", start: { floorId: "missing", x: 12, y: 30 }, destinationPoiId: "poi",
  }, Date.now()), null);
  assert.deepEqual(segments.map((segment) => segment.floorLevel), [0, 1]);
  assert.deepEqual(segments[1].polyline.at(-1), destination.point);
  assert.throws(() => loaded.routeSegments({ ...response, mapVersionId: "older" }, start.point, "g", destination), /loaded map/);
  assert.throws(() => loaded.routeSegments(response, start.point, "g", { ...destination, point: { x: 20, y: 20 } }), /endpoints/);
  for (const [leg, point] of [[0, 1], [1, 0]]) {
    const wrongConnection = structuredClone(response);
    wrongConnection.floors[leg].polyline[point][0] += 1;
    assert.throws(() => loaded.routeSegments(wrongConnection, start.point, "g", destination), /mapped connection/);
  }
  const wrongType = structuredClone(response);
  wrongType.transitions[0].transitionType = "stairs";
  assert.throws(() => loaded.routeSegments(wrongType, start.point, "g", destination), /mapped connection/);
  const stairsMap = structuredClone(fixture);
  stairsMap.graph.edges[1].edgeType = "stairs";
  const stairsVenue = createConnectedVenue(stairsMap);
  assert.equal(stairsVenue.routeSegments(wrongType, start.point, "g", destination).length, 2);
  assert.throws(() => stairsVenue.routeSegments(wrongType, start.point, "g", destination, true), /mapped connection/);
  const reverseConnection = {
    ...response,
    floors: response.floors.slice().reverse().map((floor) => ({ ...floor, polyline: floor.polyline.slice().reverse() })),
    transitions: [{ fromFloorId: "l1", toFloorId: "g", transitionType: "lift" }],
  };
  const westDestination = { ...destination, floorLevel: start.floorLevel, point: start.point };
  assert.equal(loaded.routeSegments(reverseConnection, destination.point, "l1", westDestination, true).length, 2);
  const oneWayMap = structuredClone(fixture);
  oneWayMap.graph.edges[1].isOneWay = true;
  assert.throws(() => createConnectedVenue(oneWayMap).routeSegments(
    reverseConnection, destination.point, "l1", westDestination, true,
  ), /mapped connection/);
  oneWayMap.graph.edges[1].isRestricted = true;
  assert.throws(() => createConnectedVenue(oneWayMap).routeSegments(response, start.point, "g", destination), /mapped connection/);
  const offsetMap = structuredClone(fixture);
  offsetMap.floors[1].localBounds = [20, 10, 100, 60];
  offsetMap.graph.nodes.find((node) => node.id === "lift-l1").x = 34;
  const offsetVenue = createConnectedVenue(offsetMap);
  const offsetRoute = createOfflinePlanner(offsetMap)({
    mapVersionId: offsetVenue.mapVersionId, start: start.coordinates, destinationPoiId: destination.id, mode: "step_free",
  }, Date.now());
  const offsetSegments = offsetVenue.routeSegments(offsetRoute, start.point, "g", offsetVenue.places[0], true);
  assert.deepEqual(offsetSegments[0].polyline.at(-1), { x: 40, y: 20 });
  assert.deepEqual(offsetSegments[1].polyline[0], { x: 28, y: 40 });
  assert.throws(() => createConnectedVenue({ ...fixture, mapVersion: { ...fixture.mapVersion, status: "draft" } }), /unpublished/);
  const malformed = new PlatformApiClient({
    baseUrl: "http://atlas.test",
    fetchImpl: async () => Response.json({ floors: [] }),
  });
  await assert.rejects(malformed.getMapPackage("venue"), /Invalid navigation response/);
  for (const [status, body, header, expected] of [
    [200, "not json", "payload-ref", "payload-ref"],
    [503, "unavailable", "outage-ref", "outage-ref"],
    [400, "bad request", "invalid reference", undefined],
  ]) {
    const failed = new PlatformApiClient({
      baseUrl: "http://atlas.test",
      fetchImpl: async () => new Response(body, { status, headers: { "X-Request-Id": header } }),
    });
    await assert.rejects(failed.getMapPackage("venue"), (error) => {
      assert.equal(getPlatformRequestId(error), expected);
      if (status !== 200) assert.equal(error.status, status);
      return true;
    });
  }
  const unavailable = new PlatformApiClient({
    baseUrl: "http://atlas.test",
    fetchImpl: async () => new Response(null, { status: 503 }),
  });
  await assert.rejects(unavailable.getMapPackage("venue"), (error) => error instanceof PlatformApiError && error.status === 503);
  const now = 10000;
  const snapshot = encodeVenueSnapshot(fixture, now);
  const saved = readVenueSnapshot(snapshot, fixture.venue.slug, now + 1000);
  const requestBody = { mapVersionId: "v1", start: start.coordinates, destinationPoiId: destination.id };
  assert.deepEqual(createOfflinePlanner(saved.pkg)(requestBody, now), {
    ...route, estimatedTimeS: 31,
  });
  assert.deepEqual(searchCachedVenue(saved.pkg, "coffee bar"), ["poi"]);
  const accessibleRequest = { ...requestBody, mode: "step_free" };
  assert.equal(createOfflinePlanner(saved.pkg)(accessibleRequest, now).transitions[0].transitionType, "lift");
  const stairsOnly = structuredClone(fixture);
  stairsOnly.graph.edges[1].edgeType = "stairs";
  assert.equal(createOfflinePlanner(stairsOnly)(accessibleRequest, now), null);
  const unconfirmed = structuredClone(fixture);
  delete unconfirmed.graph.edges[0].isStepFree;
  assert.equal(createOfflinePlanner(unconfirmed)(accessibleRequest, now), null);
  assert.equal(readVenueSnapshot(snapshot, "other-venue", now), null);
  assert.equal(readVenueSnapshot(snapshot, fixture.venue.slug, now - 1), null);
  assert.equal(readVenueSnapshot("{invalid", fixture.venue.slug, now), null);
  assert.equal(readVenueSnapshot(snapshot.replace('"version":1', '"version":2'), fixture.venue.slug, now), null);
  let storageValue = snapshot;
  let rejectWrite = true;
  let releaseWrite;
  const storage = {
    getItem: async () => storageValue,
    async setItem(_key, value) {
      if (rejectWrite) throw new Error("Device storage unavailable");
      if (releaseWrite) await new Promise((resolve) => { releaseWrite = resolve; });
      storageValue = value;
    },
  };
  const makeCache = () => createVenueCache(storage, "fixture-key", fixture.venue.slug, () => now + 100);
  const cache = makeCache();
  const replacement = structuredClone(fixture);
  replacement.mapVersion.id = "v2";
  replacement.graph.edges[1].closureState = "closed";
  const writeSignal = new AbortController().signal;
  assert.equal(await cache.save(replacement, now + 10, writeSignal), false);
  assert.equal((await makeCache().read()).pkg.mapVersion.id, "v1");
  rejectWrite = false;
  const brokenGraph = structuredClone(replacement);
  brokenGraph.graph.edges[0].toNodeId = "missing-node";
  assert.equal(await cache.save(brokenGraph, now + 20, writeSignal), false);
  assert.equal((await cache.read()).pkg.mapVersion.id, "v1");
  releaseWrite = () => {};
  const pendingWrite = cache.save(replacement, now + 30, writeSignal);
  await Promise.resolve();
  const cancelled = new AbortController();
  const skippedWrite = cache.save(fixture, now + 40, cancelled.signal);
  const queuedRead = cache.read();
  cancelled.abort();
  releaseWrite();
  assert.equal(await pendingWrite, true);
  assert.equal(await skippedWrite, false);
  assert.equal((await queuedRead).syncedAtMs, now + 30);
  const afterRestart = await makeCache().read();
  assert.equal(afterRestart.pkg.mapVersion.id, "v2");
  assert.equal(createOfflinePlanner(afterRestart.pkg)({ ...requestBody, mapVersionId: "v2" }, now + 100), null);
  console.log("Venue cache: failed and cancelled updates preserve the last usable snapshot.");
  const directory = await mkdtemp(join(tmpdir(), "atlas-saved-venue-"));
  try {
    const key = "map";
    const file = join(directory, key);
    let clock = now;
    const openCache = () => createVenueCache({
      getItem: (name) => readFile(join(directory, name), "utf8"),
      async setItem(name, value) {
        const path = join(directory, name);
        await writeFile(path + ".pending", value);
        await rename(path + ".pending", path);
      },
    }, key, fixture.venue.slug, () => clock);
    const load = (client, signal = writeSignal) =>
      loadPublishedVenue(client, openCache(), fixture.venue.slug, signal, () => clock);
    const fromServer = (pkg) => new PlatformApiClient({
      baseUrl: "http://atlas.test",
      fetchImpl: async (url) => Response.json(url.endsWith("/venues") ? [fixture.venue] : pkg),
    });
    const disconnected = new PlatformApiClient({
      baseUrl: "http://atlas.test",
      fetchImpl: async () => { throw new TypeError("Network disconnected"); },
    });
    await assert.rejects(load(disconnected), /could not be reached/);
    assert.equal((await load(fromServer(fixture))).saved, true);
    clock += 86_400_000;
    const reopened = await load(disconnected);
    assert.equal(reopened.offline, true);
    assert.equal(reopened.syncedAtMs, now);
    assert.deepEqual(searchCachedVenue(reopened.pkg, "coffee bar"), ["poi"]);
    const restoredRoute = createOfflinePlanner(reopened.pkg)(accessibleRequest, clock);
    assert.deepEqual(restoredRoute.floors, route.floors);
    assert.equal(restoredRoute.transitions[0].transitionType, "lift");
    const invalidUpdate = await load(fromServer(brokenGraph));
    assert.equal(invalidUpdate.offline, true);
    assert.equal(invalidUpdate.pkg.mapVersion.id, "v1");
    assert.equal(await readFile(file, "utf8"), snapshot);
    const interrupted = new AbortController();
    const interruptedSync = new PlatformApiClient({
      baseUrl: "http://atlas.test",
      fetchImpl: async (url) => {
        if (url.endsWith("/venues")) return Response.json([fixture.venue]);
        interrupted.abort();
        return Response.json(replacement);
      },
    });
    assert.equal(await load(interruptedSync, interrupted.signal), null);
    assert.equal(await readFile(file, "utf8"), snapshot);
    assert.equal((await load(fromServer(replacement))).pkg.mapVersion.id, "v2");
    assert.equal((await load(disconnected)).syncedAtMs, clock);
    assert.equal((await load(fromServer(fixture))).pkg.mapVersion.id, "v1");
    assert.equal((await load(disconnected)).pkg.mapVersion.id, "v1");
    await writeFile(file, snapshot.replace('"version":1', '"version":2'));
    await assert.rejects(load(disconnected), /could not be reached/);
    await writeFile(file, "{invalid");
    await assert.rejects(load(disconnected), /could not be reached/);
  } finally {
    await rm(directory, { recursive: true });
  }
  console.log("Venue loading: offline reopen from disk, stale sync time, search, routing, corrupt cache and invalid updates passed.");
  for (const change of [
    { closureState: "temporary_closed" },
    { isRestricted: true },
    { validUntil: new Date(now - 1).toISOString() },
    { validFrom: new Date(now + 1).toISOString() },
    { isOneWay: true, fromNodeId: "lift-l1", toNodeId: "lift-g" },
  ]) {
    const modified = structuredClone(fixture);
    Object.assign(modified.graph.edges[1], change);
    assert.equal(createOfflinePlanner(modified)(requestBody, now), null);
  }
  const scheduled = structuredClone(fixture);
  scheduled.graph.edges[1].validFrom = new Date(now + 1000).toISOString();
  scheduled.graph.edges[1].validUntil = new Date(now + 2000).toISOString();
  const scheduledPlanner = createOfflinePlanner(scheduled);
  const timedRoute = scheduledPlanner(accessibleRequest, now + 1000);
  assert.equal(timedRoute.validUntilMs, now + 2000);
  assert.equal(hasExpired(timedRoute.validUntilMs, now + 2000), false);
  assert.equal(hasExpired(timedRoute.validUntilMs, now + 2001), true);
  const multipleCutoffs = structuredClone(scheduled);
  multipleCutoffs.graph.edges[0].validUntil = new Date(now + 1500).toISOString();
  assert.equal(createOfflinePlanner(multipleCutoffs)(accessibleRequest, now + 1000).validUntilMs, now + 1500);
  const scheduledSnapshot = readVenueSnapshot(encodeVenueSnapshot(scheduled, now), scheduled.venue.slug, now);
  assert.equal(scheduledSnapshot.venue.floors[0].facilities.length, 0);
  const scheduledEdges = scheduled.graph.edges;
  assert.equal(nextEdgeAvailabilityChange(scheduledEdges, now), now + 1000);
  assert.equal(nextEdgeAvailabilityChange(scheduledEdges, now + 1000), now + 2001);
  assert.equal(nextEdgeAvailabilityChange(scheduledEdges, now + 2000), now + 2001);
  assert.equal(nextEdgeAvailabilityChange(scheduledEdges, now + 2001), null);
  for (const [time, available] of [[now, false], [now + 999, false], [now + 1000, true],
    [now + 2000, true], [now + 2001, false]]) {
    assert.deepEqual(scheduledSnapshot.venue.floorsAt(time).map((floor) => floor.facilities.map((item) => item.kind)),
      available ? [["lift"], ["lift"]] : [[], []]);
    assert.equal(Boolean(scheduledPlanner(accessibleRequest, time)), available);
  }
  const scheduledWalkway = structuredClone(fixture);
  scheduledWalkway.graph.edges[0].validUntil = new Date(now).toISOString();
  assert.equal(createConnectedVenue(scheduledWalkway, now).floors[0].walkways.length, 1);
  assert.equal(createConnectedVenue(scheduledWalkway, now + 1).floors[0].walkways.length, 0);
  scheduledWalkway.graph.edges[0].validUntil = "invalid";
  assert.equal(createConnectedVenue(scheduledWalkway, now).floors[0].walkways.length, 0);
  assert.equal(createOfflinePlanner(scheduledWalkway), null);
  for (const request of [requestBody, accessibleRequest]) {
    assert.equal(scheduledPlanner(request, now), null);
    assert.equal(scheduledPlanner(request, now + 1000).transitions[0].transitionType, "lift");
    assert.equal(scheduledPlanner(request, now + 2000).transitions[0].transitionType, "lift");
    assert.equal(scheduledPlanner(request, now + 2001), null);
  }
  const cheapDetour = structuredClone(fixture);
  cheapDetour.graph.nodes.push({ id: "detour", x: 95, y: 59, floorId: "g", nodeType: "walkway" });
  const e1 = cheapDetour.graph.edges[0];
  cheapDetour.graph.edges.push(
    { ...e1, id: "cheap1", toNodeId: "detour", baseCostM: 1 },
    { ...e1, id: "cheap2", fromNodeId: "detour", baseCostM: 1 },
  );
  assert.deepEqual(createOfflinePlanner(cheapDetour)(requestBody, now).floors[0].polyline[1], [95, 59]);
  assert.equal(isUnavailable(new PlatformApiError(400)), false);
  assert.equal(isUnavailable(new PlatformApiError(503)), true);
  const detourMap = structuredClone(fixture);
  detourMap.graph.nodes.push({ id: "branch", floorId: "g", x: 12, y: 42, nodeType: "walkway" });
  detourMap.graph.edges.push({
    ...fixture.graph.edges[0], id: "branch-edge", toNodeId: "branch",
    geometry: { type: "LineString", coordinates: [[12, 30], [12, 42]] },
  });
  const detour = findSimulatedDetour(detourMap, route, 0, { x: 12, y: 30 }, true, now);
  assert.equal(detour.to.id, "branch");
  assert.deepEqual(detour.polyline, [[12, 30], [12, 42]]);
  const scheduledBranch = structuredClone(detourMap);
  scheduledBranch.graph.edges.at(-1).validUntil = new Date(now).toISOString();
  assert.ok(findSimulatedDetour(scheduledBranch, route, 0, { x: 12, y: 30 }, true, now));
  assert.equal(findSimulatedDetour(scheduledBranch, route, 0, { x: 12, y: 30 }, true, now + 1), null);
  assert.equal(findSimulatedDetour(detourMap, route, 0, { x: 25, y: 30 }, true, now), null);
  const curvedBranch = structuredClone(detourMap);
  const branchEdge = curvedBranch.graph.edges.at(-1);
  const branchPoints = [[12, 30], [16, 34], [16, 38], [12, 42]];
  branchEdge.geometry = JSON.stringify({ type: "LineString", coordinates: branchPoints.slice().reverse() });
  const missedTurn = findSimulatedDetour(curvedBranch, route, 0, { x: 12, y: 30 }, true, now);
  assert.deepEqual(missedTurn.polyline, branchPoints);
  const walkDetour = createWalkSample(missedTurn.polyline);
  const onBranch = walkDetour(3500);
  assert.equal(onBranch.x, 16);
  assert.ok(onBranch.y > 34 && onBranch.y < 38);
  assert.equal(onBranch.complete, false);
  assert.equal(walkDetour(6000).complete, false, "The endpoint chord takes less time than the corridor");
  assert.deepEqual(walkDetour(8000), { x: 12, y: 42, complete: true });
  const branchTracker = createRouteProgress("venue", route.floors);
  const beforeDetour = createRouteReplay(route, "venue")(0, 0, 0);
  assert.equal(branchTracker.update(beforeDetour, 0).status, "following");
  const { x: branchX, y: branchY } = walkDetour(8000);
  let branchProgress;
  for (let time = 8000; time <= 10500; time += 250) {
    branchProgress = branchTracker.update({ ...beforeDetour, x: branchX, y: branchY }, time);
  }
  assert.equal(branchProgress.status, "off-route");
  const curvedRecovery = await requestReroute({
    calculateRoute: async () => { throw new PlatformApiError(503); },
  }, createOfflinePlanner(curvedBranch), "venue", {
    ...accessibleRequest, start: { floorId: "g", x: branchX, y: branchY },
  }, { offline: false, signal: new AbortController().signal, now: () => now });
  assert.equal(curvedRecovery.offline, true);
  assert.deepEqual(curvedRecovery.route.floors[0].polyline.slice(0, 4), branchPoints.slice().reverse());
  const reverseRoute = { ...route, floors: [{ floorId: "g", polyline: [[12, 42], [24, 42]] }] };
  assert.deepEqual(findSimulatedDetour(curvedBranch, reverseRoute, 0, { x: 12, y: 42 }, true, now).polyline,
    branchPoints.slice().reverse());
  branchEdge.isOneWay = true;
  assert.equal(findSimulatedDetour(curvedBranch, reverseRoute, 0, { x: 12, y: 42 }, true, now), null);
  branchEdge.isStepFree = false;
  assert.equal(findSimulatedDetour(curvedBranch, route, 0, { x: 12, y: 30 }, true, now), null);
  assert.ok(findSimulatedDetour(curvedBranch, route, 0, { x: 12, y: 30 }, false, now));
  branchEdge.geometry = "{";
  assert.equal(findSimulatedDetour(curvedBranch, route, 0, { x: 12, y: 30 }, false, now), null);
  const recoverRequest = { ...accessibleRequest, start: { floorId: "g", x: 12, y: 42 } };
  const lostNetwork = { calculateRoute: async () => { throw new PlatformApiError(503, "reroute-ref"); } };
  const recovered = await requestReroute(lostNetwork, createOfflinePlanner(detourMap), "venue", recoverRequest, {
    offline: false, signal: new AbortController().signal, now: () => now,
  });
  assert.equal(recovered.offline, true);
  assert.equal(getPlatformRequestId(recovered.fallbackError), "reroute-ref");
  assert.deepEqual(recovered.route.floors[0].polyline.slice(0, 2), [[12, 42], [12, 30]]);
  assert.equal(recovered.route.transitions[0].transitionType, "lift");
  const recoveryTracker = createRouteProgress("venue", recovered.route.floors);
  const recoverySample = createRouteReplay(recovered.route, "venue");
  assert.equal(recoveryTracker.update(recoverySample(0, 0, 0), 0).status, "following");
  assert.equal(recoveryTracker.update(recoverySample(0, 250, 250), 250).remainingM, 49.5);
  const rejected = { calculateRoute: async () => { throw new PlatformApiError(400); } };
  await assert.rejects(requestReroute(rejected, createOfflinePlanner(detourMap), "venue", recoverRequest, {
    offline: false, signal: new AbortController().signal, now: () => now,
  }), /400/);
  const abort = new AbortController();
  const late = { calculateRoute: async () => { abort.abort(); return recovered.route; } };
  await assert.rejects(requestReroute(late, createOfflinePlanner(detourMap), "venue", recoverRequest, {
    offline: false, signal: abort.signal, now: () => now,
  }), /cancelled/);
  detourMap.graph.edges.at(-1).isOneWay = true;
  const failedRecovery = await requestReroute(lostNetwork, createOfflinePlanner(detourMap), "venue", recoverRequest, {
    offline: false, signal: new AbortController().signal, now: () => now,
  });
  assert.equal(failedRecovery.route, null);
  assert.equal(failedRecovery.offline, true);
  assert.equal(getPlatformRequestId(failedRecovery.fallbackError), "reroute-ref");
  detourMap.graph.edges.at(-1).closureState = "closed";
  assert.equal(findSimulatedDetour(detourMap, route, 0, { x: 12, y: 30 }, true, now), null);
  const sample = createRouteReplay(route, "venue");
  const tracker = createRouteProgress("venue", route.floors);
  let time = 0;
  let state = tracker.update(sample(0, 0, 0), 0);
  assert.equal(state.remainingM, 38);
  while (time < 15000 && state.status !== "confirm-floor") {
    time += 250;
    state = tracker.update(sample(0, time, time), time);
  }
  assert.equal(state.status, "confirm-floor");
  assert.equal(tracker.confirmFloor("g").status, "confirm-floor");
  assert.equal(tracker.confirmFloor("l1").legIndex, 1);
  const nextStart = time;
  while (time < 30000 && state.status !== "arrived") {
    time += 250;
    state = tracker.update(sample(1, time - nextStart, time), time);
  }
  assert.equal(state.status, "arrived");
  assert.equal(state.remainingM, 0);

  const recovering = createRouteProgress("venue", route.floors);
  const origin = sample(0, 0, 0);
  const away = { ...origin, y: origin.y + 12 };
  assert.equal(recovering.update(origin, 0).status, "following");
  assert.equal(recovering.update(away, 500).status, "uncertain");
  for (const t of [1000, 1500, 2000, 2500]) recovering.update(away, t);
  assert.equal(recovering.update(away, 3000).status, "off-route");
  assert.equal(recovering.update(origin, 3500).status, "following");
  assert.equal(recovering.update({ ...origin, floorId: "l1" }, 4000).status, "uncertain");
  assert.equal(recovering.update({ ...origin, confidence: "lost" }, 4500).status, "uncertain");
  const shortRoute = [{ floorId: "g", polyline: [[0, 0], [4, 0], [4, 4]] }];
  const turning = createRouteProgress("venue", shortRoute);
  assert.deepEqual(turning.update({ ...origin, x: 0, y: 0 }, 0).nextTurn, { direction: "right", distanceM: 4 });
  const folded = createRouteProgress("venue", [{ floorId: "g", polyline: [[0, 0], [20, 0], [20, 1], [0, 1]] }]);
  const startEstimate = { ...origin, x: 0, y: 0 };
  folded.update(startEstimate, 0);
  assert.equal(folded.update({ ...startEstimate, y: 1 }, 250).status, "uncertain");
  const ambiguous = createRouteProgress("venue", [{ floorId: "g", polyline: [[0, 0], [20, 0], [20, 2], [0, 2]] }]);
  assert.equal(ambiguous.update(startEstimate, 0).status, "following");
  for (let time = 250; time <= 3250; time += 250) {
    const betweenCorridors = ambiguous.update({ ...startEstimate, x: 1, y: 1 }, time);
    assert.equal(betweenCorridors.status, "uncertain");
    assert.equal(betweenCorridors.remainingM, 42);
  }
  assert.equal(ambiguous.update({ ...startEstimate, x: 2 }, 3500).remainingM, 40);
  const nearDestination = createRouteProgress("venue", [{ floorId: "g", polyline: [[0, 0], [20, 0], [20, 2], [0, 2]] }]);
  nearDestination.update(startEstimate, 0);
  for (let time = 250; time <= 3250; time += 250) {
    const farAlongRoute = nearDestination.update({ ...startEstimate, y: 2 }, time);
    assert.equal(farAlongRoute.remainingM, 42);
    assert.equal(farAlongRoute.status, time >= 2750 ? "off-route" : "uncertain");
  }
  const backtracking = createRouteProgress("venue", [{ floorId: "g", polyline: [[0, 0], [20, 0], [20, 10]] }]);
  for (let x = 0; x <= 12; x += 2) {
    assert.equal(backtracking.update({ ...startEstimate, x }, x * 500).remainingM, 30 - x);
  }
  const instantJump = backtracking.update({ ...startEstimate, x: 1 }, 6250);
  assert.equal(instantJump.status, "uncertain");
  assert.equal(instantJump.remainingM, 18);
  const walkedBack = backtracking.update({ ...startEstimate, x: 10 }, 7000);
  assert.equal(walkedBack.status, "following");
  assert.equal(walkedBack.remainingM, 20);
  assert.deepEqual(walkedBack.nextTurn, { direction: "right", distanceM: 10 });
  console.log("Guidance replay: turns, floor confirmation, arrival, parallel corridors, backtracking and off-route recovery passed.");
  console.log("Connected venue: API request contracts, floor projection, exact route endpoints and invalid responses passed.");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
