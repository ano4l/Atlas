export type MapPoint = { x: number; y: number };
export type MapBounds = { width: number; height: number };

export type MapRoom = {
  id: string;
  name: string;
  category?: string;
  points: MapPoint[];
  label?: MapPoint;
  entrance?: { from: MapPoint; to: MapPoint };
  destination?: boolean;
};

export type MapFacilityKind = "lift" | "escalator" | "restroom" | "information" | "parking" | "accessibility";
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
  icon: "straight" | "turn-left" | "turn-right" | "escalator" | "lift" | "arrive";
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
  rooms: MapRoom[];
  facilities: MapFacility[];
  labels: MapLabel[];
  closure?: MapPoint;
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
  sponsored?: boolean;
  accessible?: boolean;
  point: MapPoint;
  description?: string;
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

