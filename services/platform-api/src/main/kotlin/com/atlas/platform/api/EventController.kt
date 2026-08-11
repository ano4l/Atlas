package com.atlas.platform.api

import com.atlas.platform.events.EventIngestionService
import com.atlas.platform.events.IncomingEvent
import com.atlas.platform.errors.BadRequestException
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Events", description = "Analytics event ingestion (techspec.md §8.2)")
@RestController
@RequestMapping("/v1/events")
class EventController(
    private val eventIngestionService: EventIngestionService,
) {

    data class BatchRequest(
        @field:NotEmpty
        @field:Size(max = 500)
        val events: List<IncomingEvent>,
    )

    @Operation(summary = "Ingest a batch of analytics events (idempotent per eventId)")
    @PostMapping("/batch")
    fun ingestBatch(@Valid @RequestBody request: BatchRequest): ResponseEntity<Map<String, Any>> {
        if (request.events.isEmpty()) {
            throw BadRequestException("Batch must contain at least one event")
        }
        val result = eventIngestionService.ingestBatch(request.events)
        return ResponseEntity.accepted().body(
            mapOf(
                "accepted" to result.accepted,
                "duplicates" to result.duplicates,
                "quarantined" to result.quarantined,
            )
        )
    }
}
