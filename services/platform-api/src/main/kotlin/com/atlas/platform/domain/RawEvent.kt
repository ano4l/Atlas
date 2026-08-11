package com.atlas.platform.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

enum class EventStatus {
    accepted, quarantined
}

@Entity
@Table(name = "events_raw")
class RawEvent(
    @Id
    @Column(name = "event_id")
    var eventId: UUID,

    @Column(name = "event_name", nullable = false)
    var eventName: String,

    @Column(name = "schema_version", nullable = false)
    var schemaVersion: Int = 1,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: OffsetDateTime,

    @Column(name = "received_at", nullable = false)
    var receivedAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "session_id")
    var sessionId: String? = null,

    @Column(name = "installation_id")
    var installationId: String? = null,

    @Column(name = "venue_id")
    var venueId: UUID? = null,

    @Column(name = "map_version_id")
    var mapVersionId: UUID? = null,

    @Column(name = "app_version")
    var appVersion: String? = null,

    var platform: String? = null,

    @Column(name = "analytics_allowed", nullable = false)
    var analyticsAllowed: Boolean = true,

    @Column(name = "personalised_ads_allowed", nullable = false)
    var personalisedAdsAllowed: Boolean = false,

    @Column(columnDefinition = "jsonb")
    var payload: String = "{}",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: EventStatus = EventStatus.accepted,

    @Column(name = "rejection_reason")
    var rejectionReason: String? = null,
)

@Entity
@Table(name = "audit_log")
class AuditLogEntry(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(nullable = false)
    var actor: String,

    @Column(nullable = false)
    var action: String,

    @Column(name = "entity_type", nullable = false)
    var entityType: String,

    @Column(name = "entity_id")
    var entityId: String? = null,

    @Column(columnDefinition = "jsonb")
    var details: String = "{}",

    @Column(name = "created_at", nullable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now(),
)
