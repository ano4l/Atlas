package com.atlas.platform.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "floors")
class Floor(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "map_version_id", nullable = false)
    var mapVersionId: UUID,

    @Column(name = "venue_id", nullable = false)
    var venueId: UUID,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var ordinal: Int,

    @Column(name = "public_label")
    var publicLabel: String? = null,

    @Column(name = "local_bounds", columnDefinition = "jsonb")
    var localBounds: String? = null,

    @Column(name = "source_scale")
    var sourceScale: Double? = null,
)
