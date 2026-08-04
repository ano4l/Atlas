// Placeholder hand-written client until OpenAPI-generated types are wired in
// (see the `generate` script in package.json). Endpoints per techspec.md §10.1.

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
}
