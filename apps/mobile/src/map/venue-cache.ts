import { isMapPackage, type MapPackage } from "@atlas/api-client";
import { createConnectedVenue } from "./connected-venue";
import { createOfflinePlanner, encodeVenueSnapshot, readVenueSnapshot } from "./offline-venue";

type VenueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export function createVenueCache(storage: VenueStorage, key: string, slug: string, now = Date.now) {
  let writes = Promise.resolve();
  return {
    async read() {
      await writes;
      const value = await storage.getItem(key).catch(() => null);
      return readVenueSnapshot(value, slug, now());
    },
    save(pkg: MapPackage, syncedAtMs: number, signal: AbortSignal) {
      const write = writes.then(async () => {
        if (signal.aborted || !isMapPackage(pkg) || pkg.venue.slug !== slug ||
            !Number.isFinite(syncedAtMs) || syncedAtMs < 0 || syncedAtMs > now()) return false;
        try {
          createConnectedVenue(pkg);
          if (!createOfflinePlanner(pkg)) return false;
          await storage.setItem(key, encodeVenueSnapshot(pkg, syncedAtMs));
          return true;
        } catch {
          return false;
        }
      });
      writes = write.then(() => undefined, () => undefined);
      return write;
    },
  };
}
