import type { MapPackage } from "@atlas/api-client";

type Edge = MapPackage["graph"]["edges"][number];
type Window = { validFrom: number | null; validUntil: number | null };

export function readEdgeWindow(edge: Edge): Window | null {
  if ((edge.validFrom != null && typeof edge.validFrom !== "string") ||
      (edge.validUntil != null && typeof edge.validUntil !== "string")) return null;
  const validFrom = edge.validFrom == null ? null : Date.parse(edge.validFrom);
  const validUntil = edge.validUntil == null ? null : Date.parse(edge.validUntil);
  if ((validFrom !== null && !Number.isFinite(validFrom)) ||
      (validUntil !== null && !Number.isFinite(validUntil)) ||
      (validFrom !== null && validUntil !== null && validFrom > validUntil)) return null;
  return { validFrom, validUntil };
}

export function isWithinEdgeWindow(window: Window, nowMs: number): boolean {
  return (window.validFrom === null || window.validFrom <= nowMs) &&
    (window.validUntil === null || nowMs <= window.validUntil);
}

export function hasExpired(validUntilMs: number | null | undefined, nowMs: number): boolean {
  return validUntilMs != null && nowMs > validUntilMs;
}

export function isPublicEdge(edge: Pick<Edge, "isRestricted" | "closureState">): boolean {
  return !edge.isRestricted && edge.closureState === "open";
}

export function isStepFreeEdge(edge: Pick<Edge, "isStepFree" | "edgeType">): boolean {
  return edge.isStepFree === true && !/^(stairs|escalator)$/i.test(edge.edgeType);
}

export function nextEdgeAvailabilityChange(edges: readonly Edge[], nowMs: number): number | null {
  let next = Infinity;
  for (const edge of edges) {
    if (!isPublicEdge(edge)) continue;
    const window = readEdgeWindow(edge);
    if (!window) continue;
    if (window.validFrom !== null && window.validFrom > nowMs) next = Math.min(next, window.validFrom);
    if (window.validUntil !== null && window.validUntil >= nowMs) next = Math.min(next, window.validUntil + 1);
  }
  return Number.isFinite(next) ? next : null;
}
