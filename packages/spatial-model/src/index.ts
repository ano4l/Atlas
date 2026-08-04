// Minimum data model for the spatial platform.
// Mirrors techspec.md §7.3. Keep this schema backward-compatible within a
// released pilot map package; bump schemaVersion on breaking changes.

import type { IsoDateTime, Uuid } from "@atlas/shared-types";

export interface Venue {
  id: Uuid;
  slug: string;
  name: string;
  status: "draft" | "active" | "inactive";
  timezone: string;
  geographicBoundary: GeoJSON.Polygon;
  defaultMapVersionId: Uuid | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Floor {
  id: Uuid;
  venueId: Uuid;
  buildingId: Uuid;
  name: string;
  ordinal: number;
  publicLabel: string;
  elevationM: number;
  localBounds: [number, number, number, number];
  sourceScale: number;
}

export interface PointOfInterest {
  id: Uuid;
  venueId: Uuid;
  floorId: Uuid;
  name: string;
  aliases: string[];
  type: string;
  categories: string[];
  keywords: string[];
  spaceGeometry: GeoJSON.Polygon;
  entranceNodeIds: Uuid[];
  openingStatus: "open" | "closed" | "temporarily_closed";
  searchableMetadata: Record<string, unknown>;
  accessibilityMetadata: Record<string, unknown>;
}

export type NavigationNodeType = "walkway" | "entrance" | "transition" | "poi_anchor";

export interface NavigationNode {
  id: Uuid;
  floorId: Uuid;
  x: number;
  y: number;
  nodeType: NavigationNodeType;
  transitionGroupId: Uuid | null;
}

export type NavigationEdgeType = "corridor" | "stairs" | "escalator" | "lift" | "ramp";

export interface NavigationEdge {
  id: Uuid;
  fromNodeId: Uuid;
  toNodeId: Uuid;
  geometry: GeoJSON.LineString;
  distanceM: number;
  estimatedTimeS: number;
  directionality: "bidirectional" | "forward" | "backward";
  edgeType: NavigationEdgeType;
  isAccessible: boolean;
  isRestricted: boolean;
  validFrom: IsoDateTime | null;
  validUntil: IsoDateTime | null;
}

export type MapVersionStatus = "draft" | "validated" | "published" | "retired";

export interface MapVersion {
  id: Uuid;
  venueId: Uuid;
  version: number;
  status: MapVersionStatus;
  schemaVersion: number;
  contentHash: string;
  publishedAt: IsoDateTime | null;
  minimumAppVersion: string;
}
