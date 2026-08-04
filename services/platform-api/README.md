# platform-api

Spring Boot (Kotlin) service implementing the public/internal API described in `techspec.md` §8 and §10.

## Run locally

```bash
./gradlew bootRun
```

Requires a running PostgreSQL/PostGIS instance — see `infrastructure/local/docker-compose.yml`.

## Note

Gradle wrapper files (`gradlew`, `gradlew.bat`, `gradle/wrapper/*`) are not yet generated. Run `gradle wrapper --gradle-version 8.8` once Gradle is installed locally, or open this directory in IntelliJ IDEA to have the wrapper generated automatically.
