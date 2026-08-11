package com.atlas.platform.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

@Entity
@Table(name = "navigation_nodes")
class NavigationNode(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "map_version_id", nullable = false)
    var mapVersionId: UUID,

    @Column(name = "floor_id", nullable = false)
    var floorId: UUID,

    @Column(nullable = false)
    var x: Double,

    @Column(nullable = false)
    var y: Double,

    @Column(name = "node_type", nullable = false)
    var nodeType: String = "corridor",

    @Column(name = "transition_group_id")
    var transitionGroupId: UUID? = null,

    @Column(nullable = false)
    var active: Boolean = true,
)

enum class ClosureState {
    open, closed, temporary_closed
}

@Entity
@Table(name = "navigation_edges")
class NavigationEdge(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "map_version_id", nullable = false)
    var mapVersionId: UUID,

    @Column(name = "from_node_id", nullable = false)
    var fromNodeId: UUID,

    @Column(name = "to_node_id", nullable = false)
    var toNodeId: UUID,

    @Column(name = "edge_type", nullable = false)
    var edgeType: String = "walkway",

    @Column(name = "base_cost_m", nullable = false)
    var baseCostM: Double,

    @Column(name = "is_one_way", nullable = false)
    var oneWay: Boolean = false,

    @Column(name = "is_restricted", nullable = false)
    var restricted: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(name = "closure_state", nullable = false)
    var closureState: ClosureState = ClosureState.open,

    @Column(name = "valid_from")
    var validFrom: OffsetDateTime? = null,

    @Column(name = "valid_until")
    var validUntil: OffsetDateTime? = null,

    @Column(name = "accessibility_metadata", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    var accessibilityMetadata: String = "{}",

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    var geometry: String? = null,
)
