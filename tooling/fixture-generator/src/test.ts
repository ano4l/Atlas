import assert from "node:assert/strict";
import { generateTwoFloorVenuePackage, syntheticVenueScenarios } from "./index";

const first = generateTwoFloorVenuePackage();
const second = generateTwoFloorVenuePackage();

assert.deepEqual(first, second, "fixture output must be deterministic");
assert.equal(first.floors.length, 2);
assert.equal(first.pois.length, 20);
const destinationNodes = new Set(first.pois.flatMap((poi) => poi.entranceNodeIds));
assert.equal(first.nodes.filter((node) => node.nodeType === "entrance" && !destinationNodes.has(node.id)).length, 3);
assert.ok(first.edges.some((edge) => edge.directionality === "forward"));
assert.equal(new Set(first.nodes.map((node) => node.id)).size, first.nodes.length);

const nodeIds = new Set(first.nodes.map((node) => node.id));
const floorIds = new Set(first.floors.map((floor) => floor.id));
for (const node of first.nodes) assert.ok(floorIds.has(node.floorId), `unknown floor ${node.floorId}`);
for (const edge of first.edges) {
  assert.ok(nodeIds.has(edge.fromNodeId), `unknown from-node ${edge.fromNodeId}`);
  assert.ok(nodeIds.has(edge.toNodeId), `unknown to-node ${edge.toNodeId}`);
  assert.ok(edge.distanceM > 0, `edge ${edge.id} must have a positive cost`);
}
for (const poi of first.pois) {
  assert.ok(floorIds.has(poi.floorId), `unknown POI floor ${poi.floorId}`);
  assert.ok(poi.entranceNodeIds.length > 0, `POI ${poi.name} must be routable`);
  assert.ok(poi.entranceNodeIds.every((id) => nodeIds.has(id)), `POI ${poi.name} has an unknown entrance`);
}

const transitionEdges = first.edges.filter((edge) => edge.edgeType === "escalator" || edge.edgeType === "lift");
assert.equal(transitionEdges.length, 2, "fixture must offer two floor-transition strategies");
assert.ok(first.pois.some((poi) => poi.name === "Zara"), "first milestone destination is missing");

const variants = syntheticVenueScenarios.map((scenario) => {
  const fixture = generateTwoFloorVenuePackage(scenario);
  assert.deepEqual(fixture, generateTwoFloorVenuePackage(scenario), scenario);
  assert.equal(fixture.venue.id, first.venue.id);
  assert.equal(fixture.venue.defaultMapVersionId, fixture.mapVersion.id);
  return fixture;
});
assert.equal(new Set(variants.map((fixture) => fixture.mapVersion.id)).size, variants.length);
assert.deepEqual(variants.slice(1).filter((_, index) => syntheticVenueScenarios[index + 1] !== "invalid-disconnected")
  .map((fixture) => fixture.nodes), Array(8).fill(first.nodes));
assert.equal(variants[1].edges[0].validUntil, "2026-08-12T00:00:00.000Z");
assert.equal(variants[2].edges.find((edge) => edge.edgeType === "lift")?.validUntil, variants[1].edges[0].validUntil);
assert.equal(variants[3].pois.find((poi) => poi.name === "Zara")?.openingStatus, "closed");
assert.equal(variants[4].edges[1].directionality, "backward");
assert.equal(variants[5].edges.find((edge) => edge.edgeType === "lift")?.isAccessible, false);
assert.ok(variants[6].pois.find((poi) => poi.name === "Zara")?.aliases.includes("New season"));
assert.equal(variants[7].nodes.length, first.nodes.length + 1);
assert.deepEqual(variants[8].edges[0].geometry.coordinates, [[8, 30], [18, 30], [18, 36], [30, 36], [35, 30]]);
assert.equal(variants[9].edges[0].validUntil, "2099-01-02T00:00:00.000Z");

process.stdout.write("fixture-generator invariants passed\n");
