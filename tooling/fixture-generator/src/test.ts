import assert from "node:assert/strict";
import { generateTwoFloorVenuePackage } from "./index";

const first = generateTwoFloorVenuePackage();
const second = generateTwoFloorVenuePackage();

assert.deepEqual(first, second, "fixture output must be deterministic");
assert.equal(first.floors.length, 2);
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

process.stdout.write("fixture-generator invariants passed\n");
