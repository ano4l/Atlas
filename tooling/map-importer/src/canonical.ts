// Deterministic canonical JSON serialization + SHA-256 checksum.
// Rules: object keys sorted lexicographically at every depth, arrays kept in
// order, numbers rendered by JSON.stringify, no insignificant whitespace.
// The checksum of a semantically identical package is therefore stable
// regardless of key ordering in the source file.

import { createHash } from "node:crypto";
import type { MapPackageChecksum, MapPackageV1 } from "@atlas/spatial-model";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function canonicalize(value: JsonValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  const body = keys
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(",");
  return `{${body}}`;
}

export function canonicalPackageJson(pkg: MapPackageV1): string {
  return canonicalize(pkg as unknown as JsonValue);
}

export function checksumPackage(pkg: MapPackageV1): MapPackageChecksum {
  const value = createHash("sha256").update(canonicalPackageJson(pkg), "utf8").digest("hex");
  return { algorithm: "sha256", canonical: "json", value };
}
