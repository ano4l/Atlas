package com.atlas.platform

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

// Entry point for the platform API (techspec.md §8, §10). Endpoints and
// admin modules are added incrementally per techspec.md §17.
@SpringBootApplication
class PlatformApiApplication

fun main(args: Array<String>) {
    runApplication<PlatformApiApplication>(*args)
}
