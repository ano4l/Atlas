# Migrations

Database migration ownership for the spatial platform (`techspec.md` §4.1, §7).

Every schema change must go through a migration here (e.g. Flyway `V{version}__{description}.sql`). None have been added yet — this directory scaffolds the location that `services/platform-api` will be wired to read from (`classpath:db/migration` by convention).

Rules:
- Every database change uses a migration.
- Production migrations require a backup and rollback plan (`techspec.md` §16).
