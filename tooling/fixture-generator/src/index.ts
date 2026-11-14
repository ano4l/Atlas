// Generates the synthetic two-floor venue fixture required by
// techspec.md §17 Phase 0/1 and §21 (first development milestone), plus
// synthetic movement sessions for replay testing (§14.2).

import type { LineString, Polygon } from "geojson";
import type { Floor, MapVersion, NavigationEdge, NavigationNode, PointOfInterest, Venue } from "@atlas/spatial-model";

export interface SyntheticVenueFixture {
  venue: Venue;
  mapVersion: MapVersion;
  floors: Floor[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  pois: PointOfInterest[];
}

export interface AdminImportPayload {
  venue: { slug: string; name: string; displayName: string; category: string; description: string };
  floors: Array<{ sourceId: string; name: string; ordinal: number; publicLabel: string; localBounds: string; sourceScale: number }>;
  nodes: Array<{ sourceId: string; floorSourceId: string; x: number; y: number; nodeType: string; transitionGroupId: string | null }>;
  edges: Array<{ sourceId: string; fromNodeSourceId: string; toNodeSourceId: string; edgeType: string; baseCostM: number; oneWay: boolean; restricted: boolean; geometry: string }>;
  pois: Array<{ sourceId: string; floorSourceId: string; name: string; aliases: string[]; searchKeywords: string[]; entryPointNodeSourceId: string; visualAnchorX: number; visualAnchorY: number; status: string }>;
}

export interface SyntheticVenuePackage extends SyntheticVenueFixture {
  schemaVersion: 1;
  adminImport: AdminImportPayload;
}

const IDS = {
  venue: "10000000-0000-4000-8000-000000000001",
  building: "10000000-0000-4000-8000-000000000002",
  mapVersion: "10000000-0000-4000-8000-000000000003",
  ground: "20000000-0000-4000-8000-000000000001",
  levelOne: "20000000-0000-4000-8000-000000000002",
  groundWest: "30000000-0000-4000-8000-000000000001",
  groundAtrium: "30000000-0000-4000-8000-000000000002",
  groundEast: "30000000-0000-4000-8000-000000000003",
  groundEscalator: "30000000-0000-4000-8000-000000000004",
  groundLift: "30000000-0000-4000-8000-000000000005",
  levelAtrium: "30000000-0000-4000-8000-000000000006",
  levelEast: "30000000-0000-4000-8000-000000000007",
  levelEscalator: "30000000-0000-4000-8000-000000000008",
  levelLift: "30000000-0000-4000-8000-000000000009",
  zaraDoor: "30000000-0000-4000-8000-000000000010",
  escalatorTransition: "40000000-0000-4000-8000-000000000001",
  liftTransition: "40000000-0000-4000-8000-000000000002",
  zara: "50000000-0000-4000-8000-000000000001",
  information: "50000000-0000-4000-8000-000000000002",
} as const;

const CREATED_AT = "2026-08-11T00:00:00.000Z";

export function generateTwoFloorVenue(): SyntheticVenueFixture {
  const venue: Venue = {
    id: IDS.venue,
    slug: "atlas-synthetic-mall",
    name: "Atlas Synthetic Mall",
    status: "active",
    timezone: "Africa/Johannesburg",
    geographicBoundary: polygon([[[28.052, -26.108], [28.053, -26.108], [28.053, -26.107], [28.052, -26.107], [28.052, -26.108]]]),
    defaultMapVersionId: IDS.mapVersion,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
  const mapVersion: MapVersion = {
    id: IDS.mapVersion,
    venueId: IDS.venue,
    version: 1,
    status: "validated",
    schemaVersion: 1,
    contentHash: "synthetic-two-floor-v2",
    publishedAt: null,
    minimumAppVersion: "0.1.0",
  };
  const floors: Floor[] = [
    floor(IDS.ground, "Ground floor", 0, "G", 0),
    floor(IDS.levelOne, "Level one", 1, "L1", 4.5),
  ];
  const nodes: NavigationNode[] = [
    node(IDS.groundWest, IDS.ground, 8, 30, "entrance"),
    node(IDS.groundAtrium, IDS.ground, 35, 30),
    node(IDS.groundEast, IDS.ground, 65, 30, "entrance"),
    node(IDS.groundEscalator, IDS.ground, 38, 34, "transition", IDS.escalatorTransition),
    node(IDS.groundLift, IDS.ground, 32, 34, "transition", IDS.liftTransition),
    node(IDS.levelAtrium, IDS.levelOne, 35, 30),
    node(IDS.levelEast, IDS.levelOne, 65, 30, "entrance"),
    node(IDS.levelEscalator, IDS.levelOne, 38, 34, "transition", IDS.escalatorTransition),
    node(IDS.levelLift, IDS.levelOne, 32, 34, "transition", IDS.liftTransition),
    node(IDS.zaraDoor, IDS.levelOne, 78, 30, "entrance"),
  ];
  const byId = new Map(nodes.map((item) => [item.id, item]));
  const edges: NavigationEdge[] = [
    edge("60000000-0000-4000-8000-000000000001", byId, IDS.groundWest, IDS.groundAtrium),
    edge("60000000-0000-4000-8000-000000000002", byId, IDS.groundAtrium, IDS.groundEast),
    edge("60000000-0000-4000-8000-000000000003", byId, IDS.groundAtrium, IDS.groundEscalator),
    edge("60000000-0000-4000-8000-000000000004", byId, IDS.groundAtrium, IDS.groundLift),
    edge("60000000-0000-4000-8000-000000000005", byId, IDS.levelAtrium, IDS.levelEast),
    edge("60000000-0000-4000-8000-000000000006", byId, IDS.levelAtrium, IDS.levelEscalator),
    edge("60000000-0000-4000-8000-000000000007", byId, IDS.levelAtrium, IDS.levelLift),
    edge("60000000-0000-4000-8000-000000000008", byId, IDS.levelEast, IDS.zaraDoor),
    edge("60000000-0000-4000-8000-000000000009", byId, IDS.groundEscalator, IDS.levelEscalator, "escalator", false),
    edge("60000000-0000-4000-8000-000000000010", byId, IDS.groundLift, IDS.levelLift, "lift", true),
  ];
  const pois: PointOfInterest[] = [
    poi(IDS.zara, IDS.levelOne, "Zara", ["ZARA", "Zara clothing"], ["fashion", "clothes", "women", "men"], IDS.zaraDoor, [76, 22, 88, 29]),
    poi(IDS.information, IDS.ground, "Information desk", ["Help desk", "Guest services"], ["information", "help"], IDS.groundAtrium, [31, 25, 39, 29]),
  ];
  const galleries = [
    {
      floorId: IDS.ground, atriumId: IDS.groundAtrium, eastId: IDS.groundEast,
      names: ["Paper & Pine", "Juniper Cafe", "Petal Studio", "Market Hall", "Nook Books", "Cedar Gifts", "Stone Bakery", "Olive Table", "Lantern Workshop"],
    },
    {
      floorId: IDS.levelOne, atriumId: IDS.levelAtrium, eastId: IDS.levelEast,
      names: ["Orbit Games", "Forma Studio", "Birch Records", "Sable Shoes", "Mica Gallery", "Velvet Thread", "Stillwater Tea", "Dune Crafts", "Kite Toys"],
    },
  ];
  galleries.forEach(({ floorId, atriumId, eastId, names }, galleryIndex) => {
    let previous = atriumId as string;
    names.forEach((name, index) => {
      const sequence = galleryIndex * names.length + index;
      const x = 14 + index * 9;
      const corridor = node(fixtureId("3", 100 + sequence * 2), floorId, x, 14);
      const entrance = node(fixtureId("3", 101 + sequence * 2), floorId, x, 9, "entrance");
      nodes.push(corridor, entrance);
      byId.set(corridor.id, corridor);
      byId.set(entrance.id, entrance);

      const link = edge(fixtureId("6", 100 + sequence * 2), byId, previous, corridor.id);
      if (index === 0) link.directionality = "forward";
      edges.push(link, edge(fixtureId("6", 101 + sequence * 2), byId, corridor.id, entrance.id));
      pois.push(poi(fixtureId("5", 100 + sequence), floorId, name, [], ["shop"], entrance.id, [x - 3, 3, x + 3, 8]));
      previous = corridor.id;
    });
    edges.push(edge(fixtureId("6", 200 + galleryIndex), byId, previous, eastId));
  });
  return { venue, mapVersion, floors, nodes, edges, pois };
}

function fixtureId(group: string, index: number): string {
  return `${group}0000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

export const syntheticVenueScenarios = [
  "baseline", "closed-corridor", "unavailable-lift", "closed-destination",
  "one-way-corridor", "inaccessible-route", "version-update", "invalid-disconnected", "curved-corridor",
  "scheduled-route",
] as const;
export type SyntheticVenueScenario = typeof syntheticVenueScenarios[number];

export function generateTwoFloorVenuePackage(scenario: SyntheticVenueScenario = "baseline"): SyntheticVenuePackage {
  const fixture = generateTwoFloorVenue();
  if (scenario !== "baseline") {
    const versionIndex = syntheticVenueScenarios.indexOf(scenario);
    if (versionIndex < 1) throw new Error(`Unknown synthetic venue scenario: ${scenario}`);
    const mapVersionId = fixtureId("1", 100 + versionIndex);
    fixture.mapVersion = {
      ...fixture.mapVersion, id: mapVersionId, version: 2, contentHash: `synthetic-two-floor-${scenario}`,
    };
    fixture.venue.defaultMapVersionId = mapVersionId;
    const expired = "2026-08-12T00:00:00.000Z";
    const westCorridor = fixture.edges.find((item) => item.fromNodeId === IDS.groundWest)!;
    const lift = fixture.edges.find((item) => item.edgeType === "lift")!;
    const zara = fixture.pois.find((item) => item.id === IDS.zara)!;
    switch (scenario) {
      case "closed-corridor":
        westCorridor.validUntil = expired;
        break;
      case "unavailable-lift":
        lift.validUntil = expired;
        break;
      case "closed-destination":
        zara.openingStatus = "closed";
        break;
      case "one-way-corridor":
        fixture.edges.find((item) => item.fromNodeId === IDS.groundAtrium &&
          item.toNodeId === IDS.groundEast)!.directionality = "backward";
        break;
      case "inaccessible-route":
        lift.isAccessible = false;
        break;
      case "version-update":
        zara.aliases.push("New season");
        break;
      case "curved-corridor":
        westCorridor.geometry = line([[8, 30], [18, 30], [18, 36], [30, 36], [35, 30]]);
        westCorridor.distanceM = 28 + Math.hypot(5, 6);
        westCorridor.estimatedTimeS = Math.ceil(westCorridor.distanceM / 1.2);
        break;
      case "scheduled-route":
        westCorridor.validUntil = "2099-01-02T00:00:00.000Z";
        lift.validUntil = "2099-01-01T00:00:00.000Z";
        break;
      case "invalid-disconnected":
        fixture.nodes.push(node(fixtureId("3", 999), IDS.ground, 4, 4));
        break;
    }
  }
  return {
    schemaVersion: 1,
    ...fixture,
    adminImport: {
      venue: { slug: fixture.venue.slug, name: fixture.venue.name, displayName: fixture.venue.name, category: "shopping_centre", description: "Deterministic two-floor development fixture" },
      floors: fixture.floors.map((item) => ({ sourceId: item.id, name: item.name, ordinal: item.ordinal, publicLabel: item.publicLabel, localBounds: JSON.stringify(item.localBounds), sourceScale: item.sourceScale })),
      nodes: fixture.nodes.map((item) => ({ sourceId: item.id, floorSourceId: item.floorId, x: item.x, y: item.y, nodeType: item.nodeType, transitionGroupId: item.transitionGroupId })),
      edges: fixture.edges.map((item) => ({ sourceId: item.id, fromNodeSourceId: item.fromNodeId, toNodeSourceId: item.toNodeId, edgeType: item.edgeType, baseCostM: item.distanceM, oneWay: item.directionality !== "bidirectional", restricted: item.isRestricted, geometry: JSON.stringify(item.geometry.coordinates) })),
      pois: fixture.pois.map((item) => ({ sourceId: item.id, floorSourceId: item.floorId, name: item.name, aliases: item.aliases, searchKeywords: item.keywords, entryPointNodeSourceId: item.entranceNodeIds[0], visualAnchorX: centre(item.spaceGeometry.coordinates[0], 0), visualAnchorY: centre(item.spaceGeometry.coordinates[0], 1), status: item.openingStatus })),
    },
  };
}

function floor(id: string, name: string, ordinal: number, publicLabel: string, elevationM: number): Floor {
  return { id, venueId: IDS.venue, buildingId: IDS.building, name, ordinal, publicLabel, elevationM, localBounds: [0, 0, 100, 60], sourceScale: 1 };
}

function node(id: string, floorId: string, x: number, y: number, nodeType: NavigationNode["nodeType"] = "walkway", transitionGroupId: string | null = null): NavigationNode {
  return { id, floorId, x, y, nodeType, transitionGroupId };
}

function edge(id: string, nodes: Map<string, NavigationNode>, fromNodeId: string, toNodeId: string, edgeType: NavigationEdge["edgeType"] = "corridor", accessible = true): NavigationEdge {
  const from = nodes.get(fromNodeId)!;
  const to = nodes.get(toNodeId)!;
  const distanceM = Math.hypot(to.x - from.x, to.y - from.y) || (edgeType === "lift" ? 6 : 8);
  return { id, fromNodeId, toNodeId, geometry: line([[from.x, from.y], [to.x, to.y]]), distanceM, estimatedTimeS: Math.ceil(distanceM / 1.2), directionality: "bidirectional", edgeType, isAccessible: accessible, isRestricted: false, validFrom: null, validUntil: null };
}

function poi(id: string, floorId: string, name: string, aliases: string[], keywords: string[], entranceNodeId: string, bounds: [number, number, number, number]): PointOfInterest {
  const [left, top, right, bottom] = bounds;
  return { id, venueId: IDS.venue, floorId, name, aliases, type: "destination", categories: ["retail"], keywords, spaceGeometry: polygon([[[left, top], [right, top], [right, bottom], [left, bottom], [left, top]]]), entranceNodeIds: [entranceNodeId], openingStatus: "open", searchableMetadata: {}, accessibilityMetadata: {} };
}

function polygon(coordinates: number[][][]): Polygon { return { type: "Polygon", coordinates }; }
function line(coordinates: number[][]): LineString { return { type: "LineString", coordinates }; }
function centre(ring: number[][], axis: 0 | 1): number { return ring.reduce((sum, point) => sum + point[axis], 0) / ring.length; }
