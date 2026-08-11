package com.atlas.platform.api

import com.atlas.platform.domain.Venue
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.FloorRepository
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.VenueRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Venues", description = "Public venue discovery and content endpoints")
@RestController
@RequestMapping("/v1/venues")
class VenueController(
    private val venueRepository: VenueRepository,
    private val mapVersionRepository: MapVersionRepository,
    private val floorRepository: FloorRepository,
) {

    @Operation(summary = "List active venues")
    @GetMapping
    fun listVenues(): List<Map<String, Any?>> =
        venueRepository.findByActiveTrue().map { it.toSummary() }

    @Operation(summary = "Venue details")
    @GetMapping("/{venueId}")
    fun getVenue(@PathVariable venueId: UUID): Map<String, Any?> {
        val venue = venueRepository.findById(venueId)
            .orElseThrow { NotFoundException("Venue not found") }
        return venue.toDetail()
    }

    @Operation(summary = "Floors for the venue's published map version")
    @GetMapping("/{venueId}/floors")
    fun getFloors(
        @PathVariable venueId: UUID,
        @RequestParam(required = false) mapVersionId: UUID?,
    ): List<Map<String, Any?>> {
        val venue = venueRepository.findById(venueId)
            .orElseThrow { NotFoundException("Venue not found") }
        val versionId = mapVersionId ?: venue.publishedMapVersionId
            ?: throw NotFoundException("Venue has no published map version")
        return floorRepository.findByMapVersionId(versionId).map {
            mapOf(
                "id" to it.id,
                "name" to it.name,
                "ordinal" to it.ordinal,
                "publicLabel" to it.publicLabel,
            )
        }
    }

    private fun Venue.toSummary() = mapOf(
        "id" to id,
        "slug" to slug,
        "name" to name,
        "displayName" to displayName,
        "category" to category,
        "active" to active,
    )

    private fun Venue.toDetail() = mapOf(
        "id" to id,
        "slug" to slug,
        "name" to name,
        "displayName" to displayName,
        "category" to category,
        "description" to description,
        "active" to active,
        "defaultLocale" to defaultLocale,
        "publishedMapVersionId" to publishedMapVersionId,
        "createdAt" to createdAt,
        "updatedAt" to updatedAt,
    )
}
