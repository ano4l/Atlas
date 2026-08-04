package com.atlas.analytics

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

// Event validation and aggregation jobs (techspec.md §8.2, §8.6). Job
// scheduling and aggregation queries land per techspec.md §17 Epic G.
@SpringBootApplication
@EnableScheduling
class AnalyticsWorkerApplication

fun main(args: Array<String>) {
    runApplication<AnalyticsWorkerApplication>(*args)
}
