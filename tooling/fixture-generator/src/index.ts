// Generates the synthetic two-floor venue fixture required by
// techspec.md §17 Phase 0/1 and §21 (first development milestone), plus
// synthetic movement sessions for replay testing (§14.2).

import type { Floor, NavigationEdge, NavigationNode, PointOfInterest, Venue } from "@atlas/spatial-model";

export interface SyntheticVenueFixture {
  venue: Venue;
  floors: Floor[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  pois: PointOfInterest[];
}

export function generateTwoFloorVenue(): SyntheticVenueFixture {
  throw new Error("generateTwoFloorVenue not implemented (Phase 0/1)");
}
