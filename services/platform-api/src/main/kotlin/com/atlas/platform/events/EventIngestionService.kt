package com.atlas.platform.events

import com.atlas.platform.domain.EventStatus
import com.atlas.platform.domain.RawEvent
import com.atlas.platform.repo.RawEventRepository
import com.atlas.platform.repo.VenueRepository
import com.fasterxml.jackson.databind.JsonNode
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

// Event ingestion per techspec.md §8.2-8.5: batch acceptance, server receipt
// time alongside device time, idempotent via client-supplied eventId, invalid
// payloads quarantined rather than silently dropped. Venue identifiers
// supplied by the client are validated against known venues before being
// trusted (§8.2).

data class IncomingEvent(
    val eventId: UUID,
    val eventName: String,
    val schemaVersion: Int = 1,
    val occurredAt: OffsetDateTime,
    val sessionId: String? = null,
    val installationId: String? = null,
    val venueId: UUID? = null,
    val mapVersionId: UUID? = null,
    val appVersion: String? = null,
    val platform: String? = null,
    val privacy: EventPrivacy = EventPrivacy(),
    val payload: JsonNode? = null,
)

data class EventPrivacy(
    val analyticsAllowed: Boolean = true,
    val personalisedAdsAllowed: Boolean = false,
)

data class BatchIngestResult(
    val accepted: Int,
    val duplicates: Int,
    val quarantined: Int,
)

@Service
class EventIngestionService(
    private val rawEventRepository: RawEventRepository,
    private val venueRepository: VenueRepository,
) {

    private val logger = LoggerFactory.getLogger(EventIngestionService::class.java)

    companion object {
        const val MAX_BATCH_SIZE = 500
        const val SUPPORTED_SCHEMA_VERSION = 1
    }

    @Transactional
    fun ingestBatch(events: List<IncomingEvent>): BatchIngestResult {
        var accepted = 0
        var duplicates = 0
        var quarantined = 0

        val knownVenueIds = events.mapNotNull { it.venueId }.toSet()
            .takeIf { it.isNotEmpty() }
            ?.let { venueRepository.findAllById(it).map { v -> v.id }.toSet() }
            ?: emptySet()

        for (event in events) {
            // Idempotency: a repeated eventId is acknowledged but not stored twice.
            if (rawEventRepository.existsById(event.eventId)) {
                duplicates++
                continue
            }

            val rejection = validate(event, knownVenueIds)
            val raw = RawEvent(
                eventId = event.eventId,
                eventName = event.eventName,
                schemaVersion = event.schemaVersion,
                occurredAt = event.occurredAt,
                receivedAt = OffsetDateTime.now(),
                sessionId = event.sessionId,
                installationId = event.installationId,
                venueId = if (rejection == null) event.venueId else event.venueId,
                mapVersionId = event.mapVersionId,
                appVersion = event.appVersion,
                platform = event.platform,
                analyticsAllowed = event.privacy.analyticsAllowed,
                personalisedAdsAllowed = event.privacy.personalisedAdsAllowed,
                payload = event.payload?.toString() ?: "{}",
                status = if (rejection == null) EventStatus.accepted else EventStatus.quarantined,
                rejectionReason = rejection,
            )
            rawEventRepository.save(raw)

            if (rejection == null) accepted++ else {
                quarantined++
                logger.warn("Quarantined event {} ({}): {}", event.eventId, event.eventName, rejection)
            }
        }

        return BatchIngestResult(accepted = accepted, duplicates = duplicates, quarantined = quarantined)
    }

    private fun validate(event: IncomingEvent, knownVenueIds: Set<UUID>): String? {
        if (event.schemaVersion != SUPPORTED_SCHEMA_VERSION) {
            return "Unsupported schemaVersion ${event.schemaVersion}"
        }
        if (event.venueId != null && event.venueId !in knownVenueIds) {
            // §8.2: never trust client-supplied venue identifiers.
            return "Unknown venueId ${event.venueId}"
        }
        if (event.occurredAt.isAfter(OffsetDateTime.now().plusMinutes(5))) {
            return "occurredAt is in the future"
        }
        return null
    }
}
