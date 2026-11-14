import { getPlatformRequestId, PlatformApiError, PlatformNetworkError, PlatformResponseError } from "@atlas/api-client";

export const DIAGNOSTIC_LIMIT = 40;
const RETENTION_MS = 30 * 60 * 1000;

type Operation = "map" | "search" | "route" | "reroute";
type Outcome = "failed" | "using-saved-map";
type Entry = {
  operation: Operation;
  outcome: Outcome;
  elapsedSeconds: number;
  cause: "http" | "network" | "invalid-response" | "local";
  status?: number;
  requestId?: string;
};

type Snapshot = { recording: boolean; entries: readonly Entry[] };
const empty: Snapshot = { recording: false, entries: [] };

export function createNavigationDiagnostics(now = Date.now) {
  let snapshot = empty;
  let startedAt = 0;
  let expires: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  function update(next: Snapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function clear() {
    clearTimeout(expires);
    expires = undefined;
    update(empty);
  }

  function current() {
    if (snapshot !== empty && now() - startedAt >= RETENTION_MS) clear();
    return snapshot;
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getSnapshot: () => snapshot,
    start() {
      clearTimeout(expires);
      startedAt = now();
      expires = setTimeout(clear, RETENTION_MS);
      update({ recording: true, entries: [] });
    },
    stop() {
      if (current().recording) update({ ...snapshot, recording: false });
    },
    clear,
    record(operation: Operation, outcome: Outcome, error?: unknown) {
      if (!current().recording) return;
      const id = getPlatformRequestId(error);
      const entry: Entry = {
        operation,
        outcome,
        elapsedSeconds: Math.max(0, Math.floor((now() - startedAt) / 1000)),
        cause: error instanceof PlatformApiError ? "http"
          : error instanceof PlatformNetworkError ? "network"
          : error instanceof PlatformResponseError ? "invalid-response" : "local",
      };
      if (error instanceof PlatformApiError) entry.status = error.status;
      if (id && /^[A-Za-z0-9_-]{1,64}$/.test(id)) entry.requestId = id;
      update({ recording: true, entries: [...snapshot.entries.slice(1 - DIAGNOSTIC_LIMIT), entry] });
    },
    exportReport() {
      const entries = current().entries;
      return entries.length ? JSON.stringify({ schemaVersion: 1, mode: "fictional-venue", entries }, null, 2) : null;
    },
  };
}

export const navigationDiagnostics = createNavigationDiagnostics();
