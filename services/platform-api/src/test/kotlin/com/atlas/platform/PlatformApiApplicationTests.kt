package com.atlas.platform

import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
@Disabled("Requires a running PostGIS instance — start infrastructure/local/docker-compose.yml first")
class PlatformApiApplicationTests {

    @Test
    fun contextLoads() {
        // Verifies the Spring context wires up cleanly (Phase 0 exit criteria).
    }
}
