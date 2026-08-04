# ADR 0001: Initial technology choices

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

The project needs a first buildable architecture (`techspec.md` §3).

## Decision

- Mobile: React Native, Expo development builds, TypeScript.
- Mobile map rendering: React Native Skia or equivalent canvas renderer.
- Dashboard: Next.js and TypeScript.
- Backend API: Spring Boot, Kotlin preferred (Java acceptable).
- Spatial database: PostgreSQL with PostGIS.
- Cache/queues: none initially; add Redis or a managed queue when measured load requires it.
- Object storage: S3-compatible storage.
- Hosting: Railway or equivalent managed container platform.
- API description: OpenAPI 3.1.

## Consequences

Every dependency must remain replaceable behind an internal interface. The platform retains ownership of the canonical venue model, routing, confidence representation, analytics events, consumer experience, and commercial data products (`techspec.md` §3.1).
