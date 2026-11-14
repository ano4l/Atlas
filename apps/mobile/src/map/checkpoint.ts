import type { ConnectedVenue } from "./connected-venue";

type CheckpointVenue = Pick<ConnectedVenue, "venueId" | "mapVersionId" | "starts">;
type Start = CheckpointVenue["starts"][number];

const checkpointPattern = /^ATLAS1:([A-Za-z0-9_-]{1,64}):([A-Za-z0-9_-]{1,64}):([A-Za-z0-9_-]{1,64})$/;

export function encodeCheckpoint(venue: CheckpointVenue, start: Start): string {
  const code = `ATLAS1:${venue.venueId}:${venue.mapVersionId}:${start.id}`;
  if (!resolveCheckpoint(venue, code)) {
    throw new Error("Invalid checkpoint");
  }
  return code;
}

export function resolveCheckpoint(venue: CheckpointVenue, code: string): Start | null {
  if (code.length > 201) return null;
  const match = checkpointPattern.exec(code);
  if (!match || match[0] !== code || match[1] !== venue.venueId || match[2] !== venue.mapVersionId) return null;
  return venue.starts.find((start) => start.id === match[3]) ?? null;
}
