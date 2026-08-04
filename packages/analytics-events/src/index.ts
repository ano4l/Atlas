// Event catalogue and envelope schema. See techspec.md §8.3-8.4.
// eventName values below must stay in sync with services/platform-api and
// services/analytics-worker validation.

import type { IsoDateTime, Uuid } from "@atlas/shared-types";

export const PRODUCT_EVENTS = [
  "venue.detected",
  "venue.selected",
  "search.submitted",
  "search.result_selected",
  "destination.viewed",
  "route.requested",
  "route.started",
  "route.rerouted",
  "route.completed",
  "route.abandoned",
  "position.corrected",
  "position.confidence_changed",
  "floor.transition_detected",
] as const;

export const MOVEMENT_EVENTS = [
  "navigation.position_sampled",
  "zone.entered",
  "zone.exited",
  "poi.passed",
  "poi.entered",
  "dwell.completed",
] as const;

export const ADVERTISING_EVENTS = [
  "ad.eligible",
  "ad.impression",
  "ad.clicked",
  "ad.destination_selected",
  "ad.route_influenced",
] as const;

export const QUALITY_EVENTS = [
  "sensor.capabilities_detected",
  "positioning.fix_received",
  "positioning.anomaly_detected",
  "map.issue_reported",
  "app.error",
] as const;

export type EventName =
  | (typeof PRODUCT_EVENTS)[number]
  | (typeof MOVEMENT_EVENTS)[number]
  | (typeof ADVERTISING_EVENTS)[number]
  | (typeof QUALITY_EVENTS)[number];

export interface EventEnvelope<TPayload = Record<string, unknown>> {
  eventId: Uuid;
  eventName: EventName;
  schemaVersion: number;
  occurredAt: IsoDateTime;
  sessionId: string;
  installationId: string;
  venueId: string | null;
  mapVersionId: string | null;
  appVersion: string;
  platform: "ios" | "android" | "web";
  privacy: {
    analyticsAllowed: boolean;
    personalisedAdsAllowed: boolean;
  };
  payload: TPayload;
}

export function isKnownEventName(name: string): name is EventName {
  return (
    (PRODUCT_EVENTS as readonly string[]).includes(name) ||
    (MOVEMENT_EVENTS as readonly string[]).includes(name) ||
    (ADVERTISING_EVENTS as readonly string[]).includes(name) ||
    (QUALITY_EVENTS as readonly string[]).includes(name)
  );
}
