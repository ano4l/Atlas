// Runtime schema for MapPackageV1 (packages/spatial-model/src/map-package.ts).
// Zod performs structural validation; cross-entity and geometric rules live
// in validate.ts so every failure can carry a stable, structured code.

import { z } from "zod";

const uuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "must be a UUID",
);

const finiteNumber = z.number().finite();
const isoDateTime = z.iso.datetime({ offset: true });

const position = z.tuple([finiteNumber, finiteNumber]).or(z.tuple([finiteNumber, finiteNumber, finiteNumber]));

const polygon = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(position).min(4)).min(1),
});

const lineString = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(position).min(2),
});

const venue = z.object({
  id: uuid,
  slug: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["draft", "active", "inactive"]),
  timezone: z.string().min(1),
  geographicBoundary: polygon,
  defaultMapVersionId: uuid.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

const mapVersion = z.object({
  id: uuid,
  venueId: uuid,
  version: z.number().int().positive(),
  status: z.enum(["draft", "validated", "published", "retired"]),
  schemaVersion: z.literal(1),
  contentHash: z.string().min(1),
  publishedAt: isoDateTime.nullable(),
  minimumAppVersion: z.string().min(1),
});

const floor = z.object({
  id: uuid,
  venueId: uuid,
  buildingId: uuid,
  name: z.string().min(1),
  ordinal: z.number().int(),
  publicLabel: z.string().min(1),
  elevationM: finiteNumber,
  localBounds: z.tuple([finiteNumber, finiteNumber, finiteNumber, finiteNumber]),
  sourceScale: z.number().positive().finite(),
});

const node = z.object({
  id: uuid,
  floorId: uuid,
  x: finiteNumber,
  y: finiteNumber,
  nodeType: z.enum(["walkway", "entrance", "transition", "poi_anchor"]),
  transitionGroupId: uuid.nullable(),
});

const edge = z.object({
  id: uuid,
  fromNodeId: uuid,
  toNodeId: uuid,
  geometry: lineString,
  distanceM: z.number().positive().finite(),
  estimatedTimeS: z.number().positive().finite(),
  directionality: z.enum(["bidirectional", "forward", "backward"]),
  edgeType: z.enum(["corridor", "stairs", "escalator", "lift", "ramp"]),
  isAccessible: z.boolean(),
  isRestricted: z.boolean(),
  validFrom: isoDateTime.nullable(),
  validUntil: isoDateTime.nullable(),
});

const poi = z.object({
  id: uuid,
  venueId: uuid,
  floorId: uuid,
  name: z.string().min(1),
  aliases: z.array(z.string()),
  type: z.string().min(1),
  categories: z.array(z.string()),
  keywords: z.array(z.string()),
  spaceGeometry: polygon,
  entranceNodeIds: z.array(uuid).min(1),
  openingStatus: z.enum(["open", "closed", "temporarily_closed"]),
  searchableMetadata: z.record(z.string(), z.unknown()),
  accessibilityMetadata: z.record(z.string(), z.unknown()),
});

export const mapPackageV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    venue,
    mapVersion,
    floors: z.array(floor).min(1),
    nodes: z.array(node),
    edges: z.array(edge),
    pois: z.array(poi),
  })
  // The generator emits an `adminImport` projection alongside the package;
  // it is derived data, validated by the backend import orchestrator instead.
  .strip();

export type ParsedMapPackageV1 = z.infer<typeof mapPackageV1Schema>;
