# Environments

Configuration for development, staging, and pilot production environments (`techspec.md` §16).

- `development` — synthetic venues, local PostGIS, no production credentials.
- `staging` — production-like infrastructure, restricted real pilot maps, test campaigns.
- `pilot-production` — published venue packages, restricted dashboard, backups/monitoring/audit logs.

No environment-specific secrets or credentials should be committed here. Use a secrets manager and reference variable names only.
