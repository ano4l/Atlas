package com.atlas.platform.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

enum class PoiStatus {
    open, temporarily_closed, closed
}

@Entity
@Table(name = "points_of_interest")
class PointOfInterest(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "map_version_id", nullable = false)
    var mapVersionId: UUID,

    @Column(name = "venue_id", nullable = false)
    var venueId: UUID,

    @Column(name = "floor_id", nullable = false)
    var floorId: UUID,

    @Column(nullable = false)
    var name: String,

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    var aliases: String = "[]",

    @Column(name = "category_id")
    var categoryId: UUID? = null,

    var subcategory: String? = null,

    @Column(name = "visual_anchor_x")
    var visualAnchorX: Double? = null,

    @Column(name = "visual_anchor_y")
    var visualAnchorY: Double? = null,

    @Column(name = "entry_point_node_id")
    var entryPointNodeId: UUID? = null,

    @Column(name = "search_keywords", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    var searchKeywords: String = "[]",

    @Column(name = "opening_hours", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    var openingHours: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PoiStatus = PoiStatus.open,

    @Column(name = "accessibility_notes")
    var accessibilityNotes: String? = null,
)

@Entity
@Table(name = "poi_categories")
class PoiCategory(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "venue_id")
    var venueId: UUID? = null,

    @Column(nullable = false)
    var name: String,

    @Column(name = "parent_id")
    var parentId: UUID? = null,
)
