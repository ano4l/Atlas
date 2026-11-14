import { readFile } from "node:fs/promises";
import { validateMapPackage } from "./index";

const usage = [
  "map-importer operator venues",
  "map-importer operator import <package.json>",
  "map-importer operator versions <venue-id>",
  "map-importer operator validate <venue-id> <map-version-id>",
  "map-importer operator publish <venue-id> <map-version-id>",
  "map-importer operator rollback <venue-id> <map-version-id>",
  "map-importer operator closure <edge-id> <open|closed> [reason]",
].join("\n");

function id(value: string): string {
  if (value.length !== 36 || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Expected a UUID from the Platform API");
  }
  return value;
}

export async function runOperator([action, ...args]: string[]): Promise<void> {
  const apiKey = process.env.ATLAS_OPERATOR_KEY?.trim();
  const base = new URL(process.env.ATLAS_OPERATOR_API_URL || "http://localhost:18080");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if (base.protocol !== "https:" && !(base.protocol === "http:" && local)) {
    throw new Error("Use HTTPS for the operator API outside localhost");
  }
  if (base.username || base.password || base.search || base.hash) throw new Error("Invalid operator API URL");
  if (!apiKey) throw new Error("Set ATLAS_OPERATOR_KEY to the operator API key");

  let method = "GET";
  let path: string;
  let body: unknown;
  if (action === "venues" && args.length === 0) {
    path = "venues";
  } else if (action === "import" && args.length === 1) {
    const report = validateMapPackage(JSON.parse(await readFile(args[0], "utf8")));
    if (!report.valid) {
      console.error(JSON.stringify(report.errors, null, 2));
      throw new Error("Map package did not pass local validation");
    }
    method = "POST";
    path = "map-packages/import";
    body = report.package;
  } else if (action === "versions" && args.length === 1) {
    path = `venues/${id(args[0])}/map-versions`;
  } else if ((action === "validate" || action === "publish" || action === "rollback") && args.length === 2) {
    method = action === "validate" ? "GET" : "POST";
    path = `venues/${id(args[0])}/map-versions/${id(args[1])}/${action === "validate" ? "validation" : action}`;
  } else if (action === "closure" && (args.length === 2 || args.length === 3) &&
      (args[1] === "open" || args[1] === "closed")) {
    method = "POST";
    path = `closures/edges/${id(args[0])}`;
    body = { closureState: args[1], reason: args[2] };
  } else {
    throw new Error(usage);
  }

  const response = await fetch(`${base.href.replace(/\/$/, "")}/v1/admin/${path}`, {
    method,
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json().catch(() => undefined);
  const requestId = response.headers.get("X-Request-Id");
  const reference = requestId && /^[A-Za-z0-9_-]{1,64}$/.test(requestId) ? ` (reference ${requestId})` : "";
  if (!response.ok) {
    const message = typeof result?.message === "string" ? ` — ${result.message.replaceAll(apiKey, "[redacted]")}` : "";
    throw new Error(`Platform API returned HTTP ${response.status}${reference}${message}`);
  }
  if (result === undefined) throw new Error(`Platform API returned an invalid JSON response${reference}`);
  console.log(JSON.stringify(result, null, 2));
  if (action === "validate" && result.valid !== true) process.exitCode = 1;
}
