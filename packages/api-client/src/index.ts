import {
  isMapPackage,
  isRoute,
  isSearchResponse,
  isVenueList,
  type RouteRequest,
} from "./navigation";

export type { MapPackage, Route, RouteRequest } from "./navigation";
export { isMapPackage } from "./navigation";

export interface ApiClientConfig {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export class PlatformApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async getVenuesNearby(lat: number, lng: number) {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/venues/nearby?lat=${lat}&lng=${lng}`);
    if (!response.ok) throw new Error(`getVenuesNearby failed: ${response.status}`);
    return response.json();
  }

  listVenues(signal?: AbortSignal) {
    return this.request("/v1/venues", isVenueList, { signal });
  }

  getMapPackage(venueId: string, signal?: AbortSignal) {
    return this.request(this.venuePath(venueId, "map-package"), isMapPackage, { signal });
  }

  search(venueId: string, mapVersionId: string, query: string, signal?: AbortSignal) {
    const parameters = "q=" + encodeURIComponent(query) + "&mapVersionId=" + encodeURIComponent(mapVersionId);
    return this.request(this.venuePath(venueId, "search") + "?" + parameters, isSearchResponse, { signal });
  }

  calculateRoute(venueId: string, route: RouteRequest, signal?: AbortSignal) {
    return this.request(this.venuePath(venueId, "routes"), isRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(route),
      signal,
    });
  }

  private venuePath(venueId: string, endpoint: string) {
    return "/v1/venues/" + encodeURIComponent(venueId) + "/" + endpoint;
  }

  private async request<T>(
    path: string,
    valid: (value: unknown) => value is T,
    init: RequestInit,
  ): Promise<T> {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (init.signal?.aborted) cancel();
    init.signal?.addEventListener("abort", cancel);
    const timer = setTimeout(cancel, 12000);
    try {
      const response = await this.fetchImpl(this.baseUrl + path, { ...init, signal: controller.signal })
        .catch((cause: unknown) => { throw new PlatformNetworkError(cause); });
      const header = response.headers.get("X-Request-Id");
      const requestId = header && /^[A-Za-z0-9_-]{1,64}$/.test(header) ? header : undefined;
      if (!response.ok) throw new PlatformApiError(response.status, requestId);
      const body: unknown = await response.json().catch(() => undefined);
      if (!valid(body)) throw new PlatformResponseError(requestId);
      return body;
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener("abort", cancel);
    }
  }
}

export class PlatformNetworkError extends Error {
  constructor(cause: unknown) {
    super("Platform API could not be reached", { cause });
  }
}

export class PlatformApiError extends Error {
  constructor(readonly status: number, readonly requestId?: string) {
    super("Platform API returned " + status);
  }
}

export class PlatformResponseError extends Error {
  constructor(readonly requestId?: string) {
    super("Invalid navigation response");
  }
}

export function getPlatformRequestId(error: unknown): string | undefined {
  return error instanceof PlatformApiError || error instanceof PlatformResponseError ? error.requestId : undefined;
}
