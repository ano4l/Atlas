export type PlaceMemory = { saved: string[]; recent: string[] };
export const emptyPlaceMemory: PlaceMemory = { saved: [], recent: [] };
const cleanIds = (value: unknown, validIds: Set<string>, limit: number) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string => typeof id === "string" && validIds.has(id),
          ),
        ),
      ].slice(0, limit)
    : [];
export function parsePlaceMemory(
  raw: string | null,
  ids: string[],
): PlaceMemory {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    if (!value || typeof value !== "object") return emptyPlaceMemory;
    const data = value as Record<string, unknown>;
    const validIds = new Set(ids);
    return {
      saved: cleanIds(data.saved, validIds, ids.length),
      recent: cleanIds(data.recent, validIds, 5),
    };
  } catch {
    return emptyPlaceMemory;
  }
}
export function rememberPlace(memory: PlaceMemory, id: string): PlaceMemory {
  return {
    ...memory,
    recent: [id, ...memory.recent.filter((item) => item !== id)].slice(0, 5),
  };
}
export function toggleSavedPlace(memory: PlaceMemory, id: string): PlaceMemory {
  return {
    ...memory,
    saved: memory.saved.includes(id)
      ? memory.saved.filter((item) => item !== id)
      : [...memory.saved, id],
  };
}
