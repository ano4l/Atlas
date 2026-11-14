export type MapPoint = { x: number; y: number };
export type MapBounds = { width: number; height: number };

export type MapRoom = {
  id: string;
  name: string;
  category?: string;
  /** Fictional tenant added for visual testing. */
  demo?: boolean;
  points: MapPoint[];
  label?: MapPoint;
  entrance?: { from: MapPoint; to: MapPoint };
  destination?: boolean;
  /** Unconfirmed tenants show their unit references only when zoomed in. */
  labelMode?: "always" | "detail";
};

export type MapFacilityKind =
  | "lift"
  | "escalator"
  | "restroom"
  | "information"
  | "parking"
  | "accessibility";
export type MapFacility = {
  id: string;
  kind: MapFacilityKind;
  point: MapPoint;
  label?: string;
};

export type MapLabel = {
  id: string;
  text: string;
  point: MapPoint;
  rotate?: number;
  prominent?: boolean;
};

export type NavigationStep = {
  id: string;
  instruction: string;
  subInstruction: string;
  distanceM: number;
  icon:
    | "straight"
    | "turn-left"
    | "turn-right"
    | "escalator"
    | "lift"
    | "arrive";
  floorLevel: number;
  floorName: string;
  nodePoint: MapPoint;
};

export type RouteFloorSegment = {
  floorId: string;
  floorLevel: number;
  polyline: MapPoint[];
  transitionAt?: MapPoint;
  transitionType?: "escalator" | "lift" | "stairs";
  transitionToFloorId?: string;
  transitionToLevel?: number;
};

export type IndoorFloor = {
  id: string;
  level: number;
  name: string;
  shortLabel: string;
  bounds: MapBounds;
  plate: MapPoint[];
  concourses: MapPoint[][];
  /** Walkway centre lines from a published schematic graph. */
  walkways?: MapPoint[][];
  /** Abstract routing network only; not surveyed architectural geometry. */
  corridorPaths?: MapPoint[][];
  contextZones?: MapPoint[][];
  rooms: MapRoom[];
  facilities: MapFacility[];
  labels: MapLabel[];
  closure?: MapPoint;
  contextRoad?: string;
  siteBoundary?: MapPoint[];
  overviewPoints?: MapPoint[];
  contextLabels?: MapLabel[];
  courts?: { point: MapPoint; radius: number }[];
};

export type POIItem = {
  id: string;
  name: string;
  category: string;
  floorLevel: number;
  floorName: string;
  walkTimeMin: number;
  distanceM: number;
  openingStatus: string;
  entranceInfo: string;
  demo?: boolean;
  sponsored?: boolean;
  accessible?: boolean;
  point: MapPoint;
  description?: string;
  /** Demo unit reference. point is the doorway, not the shop's label centre. */
  unitLabel?: string;
};

export type IndoorMapData = {
  venueName: string;
  floors: IndoorFloor[];
  route: RouteFloorSegment[];
  steps: NavigationStep[];
  start: MapPoint;
  startFloorLevel: number;
  destination: POIItem;
};
