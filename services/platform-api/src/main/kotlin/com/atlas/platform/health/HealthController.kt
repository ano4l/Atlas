package com.atlas.platform.health

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

// Lightweight liveness check, distinct from Spring Actuator's operational
// health endpoint, to unblock Phase 0 "app builds and runs" verification.
@RestController
class HealthController {

    @GetMapping("/v1/health")
    fun health(): Map<String, String> = mapOf("status" to "ok")
}
