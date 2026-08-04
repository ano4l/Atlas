// Optional camera-assisted positioning (techspec.md §5.1 step 7, §6.2, §6.8).
// Two viable approaches, following automaticdai/yfips-indoor-positioning-system:
//   1. Fiducial markers (AprilTag-style) placed at known venue coordinates —
//      simplest to calibrate, requires venue operator to place markers.
//   2. Reference-image matching (ORB features + homography against a known
//      overhead/landmark image) — no physical markers, more fragile.
// Actual CV inference must run on-device (mobile) or via a native module;
// this package only defines the shared contract so positioning-core stays
// UI/platform-independent (techspec.md §4.1).

export type VisualFixMethod = "fiducial_marker" | "reference_image_match";

export interface VisualFix {
  method: VisualFixMethod;
  floorId: string;
  x: number;
  y: number;
  headingDegrees: number | null;
  /** Match/reprojection quality in [0,1]; used to gate confidence (techspec.md §6.10). */
  qualityScore: number;
  timestampMs: number;
}

export interface VisualPositioningProvider {
  /** Returns null when no marker/reference match is found in the current frame. */
  detect(): Promise<VisualFix | null>;
}
