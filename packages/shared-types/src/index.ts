// Cross-application types and constants shared by mobile, dashboard, and services.
// See techspec.md §7.3 for the canonical entity definitions this package should mirror.

export type Uuid = string;

export type IsoDateTime = string;

export interface GeographicPoint {
  lat: number;
  lng: number;
}

export const API_VERSION = "v1";
