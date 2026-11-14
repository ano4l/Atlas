import { PlatformResponseError, type PlatformApiClient } from "@atlas/api-client";
import { createConnectedVenue } from "./connected-venue";
import { isUnavailable } from "./offline-venue";
import type { createVenueCache } from "./venue-cache";

export async function loadPublishedVenue(
  client: Pick<PlatformApiClient, "listVenues" | "getMapPackage">,
  cache: ReturnType<typeof createVenueCache>,
  slug: string,
  signal: AbortSignal,
  now = Date.now,
) {
  try {
    const venues = await client.listVenues(signal);
    const venue = venues.find((item) => item.slug === slug);
    if (!venue || signal.aborted) return null;
    const pkg = await client.getMapPackage(venue.id, signal);
    if (signal.aborted) return null;
    if (pkg.venue.id !== venue.id || pkg.venue.slug !== slug) throw new PlatformResponseError();
    let connected: ReturnType<typeof createConnectedVenue>;
    try {
      connected = createConnectedVenue(pkg);
    } catch {
      throw new PlatformResponseError();
    }
    const syncedAtMs = now();
    const saved = await cache.save(pkg, syncedAtMs, signal);
    return signal.aborted ? null : {
      pkg, venue: connected, syncedAtMs, offline: false as const, saved,
    };
  } catch (error) {
    if (signal.aborted) return null;
    if (isUnavailable(error) || error instanceof PlatformResponseError) {
      const snapshot = await cache.read();
      if (signal.aborted) return null;
      if (snapshot) return { ...snapshot, offline: true as const, saved: true, fallbackError: error };
    }
    throw error;
  }
}
