package com.atlas.platform.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

enum class MapVersionStatus {
    draft, validated, published, retired
}

@Entity
@Table(name = "map_versions")
class MapVersion(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "venue_id", nullable = false)
    var venueId: UUID,

    @Column(nullable = false)
    var version: Int,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: MapVersionStatus = MapVersionStatus.draft,

    @Column(name = "imported_source_checksum")
    var importedSourceChecksum: String? = null,

    @Column(name = "created_by")
    var createdBy: String? = null,

    @Column(name = "published_at")
    var publishedAt: OffsetDateTime? = null,

    @Column(name = "minimum_app_version")
    var minimumAppVersion: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now(),
)
