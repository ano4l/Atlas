package com.atlas.platform.repo

import com.atlas.platform.domain.AuditLogEntry
import com.atlas.platform.domain.Beacon
import com.atlas.platform.domain.Floor
import com.atlas.platform.domain.MapVersion
import com.atlas.platform.domain.MapVersionStatus
import com.atlas.platform.domain.NavigationEdge
import com.atlas.platform.domain.NavigationNode
import com.atlas.platform.domain.PointOfInterest
import com.atlas.platform.domain.PoiCategory
import com.atlas.platform.domain.RawEvent
import com.atlas.platform.domain.Venue
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.Optional
import java.util.UUID

interface VenueRepository : JpaRepository<Venue, UUID> {
    fun findByActiveTrue(): List<Venue>
    fun findBySlug(slug: String): Optional<Venue>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select venue from Venue venue where venue.id = :id")
    fun lockById(@Param("id") id: UUID): Optional<Venue>
}

interface MapVersionRepository : JpaRepository<MapVersion, UUID> {
    fun findByVenueId(venueId: UUID): List<MapVersion>
    fun findByVenueIdAndStatus(venueId: UUID, status: MapVersionStatus): List<MapVersion>
    fun findTopByVenueIdOrderByVersionDesc(venueId: UUID): Optional<MapVersion>
    fun findByImportedSourceChecksum(importedSourceChecksum: String): Optional<MapVersion>
}

interface FloorRepository : JpaRepository<Floor, UUID> {
    fun findByMapVersionId(mapVersionId: UUID): List<Floor>
}

interface NavigationNodeRepository : JpaRepository<NavigationNode, UUID> {
    fun findByMapVersionId(mapVersionId: UUID): List<NavigationNode>
    fun findByMapVersionIdAndActiveTrue(mapVersionId: UUID): List<NavigationNode>
}

interface NavigationEdgeRepository : JpaRepository<NavigationEdge, UUID> {
    fun findByMapVersionId(mapVersionId: UUID): List<NavigationEdge>
}

interface PointOfInterestRepository : JpaRepository<PointOfInterest, UUID> {
    fun findByMapVersionId(mapVersionId: UUID): List<PointOfInterest>
    fun findByVenueIdAndFloorId(venueId: UUID, floorId: UUID): List<PointOfInterest>
}

interface PoiCategoryRepository : JpaRepository<PoiCategory, UUID>

interface BeaconRepository : JpaRepository<Beacon, UUID> {
    fun findByMapVersionId(mapVersionId: UUID): List<Beacon>
    fun findByMapVersionIdAndActiveTrue(mapVersionId: UUID): List<Beacon>
}

interface RawEventRepository : JpaRepository<RawEvent, UUID>

interface AuditLogRepository : JpaRepository<AuditLogEntry, UUID>
