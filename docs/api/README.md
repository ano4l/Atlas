# API & event documentation

The authoritative API contract is the OpenAPI 3.1 spec maintained alongside `services/platform-api` (`techspec.md` §3, §10). This directory holds human-readable documentation and the event catalogue reference.

- Consumer endpoints: `techspec.md` §10.1
- Route request/response shape: `techspec.md` §10.2-10.3
- Admin endpoint groups: `techspec.md` §10.4
- Event catalogue: `techspec.md` §8.4, mirrored in code at `packages/analytics-events`

TODO: publish generated OpenAPI YAML/JSON here once `services/platform-api` defines its first endpoints.
