package com.atlas.platform.mappackage

import com.atlas.platform.domain.PoiStatus
import com.fasterxml.jackson.databind.JsonNode
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Positive
import java.time.OffsetDateTime
import java.util.UUID

data class MapPackageImportRequest(
    val schemaVersion: Int,
    @field:Valid val venue: VenueSource,
    @field:Valid val mapVersion: MapVersionSource,
    @field:NotEmpty val floors: List<@Valid FloorSource>,
    @field:NotEmpty val nodes: List<@Valid NodeSource>,
    @field:NotEmpty val edges: List<@Valid EdgeSource>,
    @field:NotEmpty val pois: List<@Valid PoiSource>,
)

data class VenueSource(
    @field:NotBlank val id: String,
    @field:NotBlank val slug: String,
    @field:NotBlank val name: String,
    val displayName: String? = null,
    val category: String? = null,
    val description: String? = null,
)

data class MapVersionSource(
    @field:NotBlank val id: String,
    @field:NotBlank val venueId: String,
    val version: Int,
    val minimumAppVersion: String? = null,
)

data class FloorSource(
    @field:NotBlank val id: String,
    @field:NotBlank val venueId: String,
    @field:NotBlank val name: String,
    val ordinal: Int,
    val publicLabel: String? = null,
    val localBounds: JsonNode? = null,
    @field:Positive val sourceScale: Double? = null,
)

data class NodeSource(
    @field:NotBlank val id: String,
    @field:NotBlank val floorId: String,
    val x: Double,
    val y: Double,
    val nodeType: String = "walkway",
    val transitionGroupId: String? = null,
)

data class EdgeSource(
    @field:NotBlank val id: String,
    @field:NotBlank val fromNodeId: String,
    @field:NotBlank val toNodeId: String,
    val geometry: JsonNode? = null,
    @field:Positive val distanceM: Double,
    val directionality: String = "bidirectional",
    val edgeType: String = "corridor",
    val isRestricted: Boolean = false,
    val validFrom: OffsetDateTime? = null,
    val validUntil: OffsetDateTime? = null,
)

data class PoiSource(
    @field:NotBlank val id: String,
    @field:NotBlank val venueId: String,
    @field:NotBlank val floorId: String,
    @field:NotBlank val name: String,
    val aliases: List<String> = emptyList(),
    val keywords: List<String> = emptyList(),
    val type: String = "destination",
    val categories: List<String> = emptyList(),
    val entranceNodeIds: List<String> = emptyList(),
    val openingStatus: PoiStatus = PoiStatus.open,
    val searchableMetadata: JsonNode? = null,
    val accessibilityMetadata: JsonNode? = null,
)

data class SourceIdMappings(
    val floors: Map<String, UUID>,
    val nodes: Map<String, UUID>,
    val edges: Map<String, UUID>,
    val pois: Map<String, UUID>,
)

data class MapPackageImportResponse(
    val created: Boolean,
    val checksum: String,
    val venueId: UUID,
    val mapVersionId: UUID,
    val mapVersion: Int,
    val mappings: SourceIdMappings,
)

data class MapValidationIssue(
    val code: String,
    val path: String,
    val message: String,
)

data class MapValidationReport(
    val valid: Boolean,
    val issues: List<MapValidationIssue>,
)
