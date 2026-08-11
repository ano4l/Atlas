// Validates GIS/map source packages against the MapPackageV1 contract
// (packages/spatial-model/src/map-package.ts, techspec.md §7.3, §9.3).
// Layered validation: structural (Zod, schema.ts) then cross-entity and
// geometric semantics (validate.ts). Canonical JSON + SHA-256 checksums
// (canonical.ts) give packages a stable content identity for idempotent
// backend import.

import { mapPackageV1Schema } from "./schema";
import { validatePackageSemantics } from "./validate";
import type { ValidationIssue, ValidationReport } from "./validate";

export type { ValidationIssue, ValidationReport } from "./validate";
export { canonicalPackageJson, canonicalize, checksumPackage } from "./canonical";
export type { MapPackageV1, MapPackageChecksum } from "@atlas/spatial-model";
export type {
  Floor,
  MapVersion,
  NavigationEdge,
  NavigationEdgeType,
  NavigationNode,
  NavigationNodeType,
  PointOfInterest,
  Venue,
} from "@atlas/spatial-model";

export interface PackageValidationResult extends ValidationReport {
  /** The parsed, schema-conforming package. Present only when structural validation passed. */
  package?: import("@atlas/spatial-model").MapPackageV1;
}

/**
 * Validates an unknown JSON value as a MapPackageV1 artifact.
 * Structural failures short-circuit; semantic checks run on the parsed value.
 */
export function validateMapPackage(source: unknown): PackageValidationResult {
  const parsed = mapPackageV1Schema.safeParse(source);
  if (!parsed.success) {
    const errors: ValidationIssue[] = parsed.error.issues.map((issue) => ({
      code: structuralCode(issue.code),
      severity: "error" as const,
      entityType: entityTypeForPath(issue.path),
      path: formatPath(issue.path),
      message: issue.message,
    }));
    return { valid: false, errors, warnings: [] };
  }
  const report = validatePackageSemantics(parsed.data);
  return { ...report, package: parsed.data };
}

function structuralCode(zodCode: string): string {
  switch (zodCode) {
    case "invalid_type":
      return "SCHEMA_INVALID_TYPE";
    case "invalid_value":
      return "SCHEMA_INVALID_VALUE";
    case "invalid_enum_value":
      return "SCHEMA_INVALID_ENUM";
    case "invalid_format":
      return "SCHEMA_INVALID_FORMAT";
    case "too_small":
      return "SCHEMA_TOO_SMALL";
    case "too_big":
      return "SCHEMA_TOO_BIG";
    default:
      return "SCHEMA_INVALID";
  }
}

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) return "$";
  return path
    .map((segment, i) => (typeof segment === "number" ? `[${segment}]` : i === 0 ? String(segment) : `.${String(segment)}`))
    .join("");
}

function entityTypeForPath(path: PropertyKey[]): ValidationIssue["entityType"] {
  const head = String(path[0] ?? "package");
  switch (head) {
    case "venue":
      return "venue";
    case "mapVersion":
      return "mapVersion";
    case "floors":
      return "floor";
    case "nodes":
      return "node";
    case "edges":
      return "edge";
    case "pois":
      return "poi";
    default:
      return "package";
  }
}
