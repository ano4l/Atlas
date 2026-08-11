package com.atlas.platform.api

import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.BeaconRepository
import com.atlas.platform.repo.VenueRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Positioning config", description = "Beacon configuration for the on-device positioning engine (techspec.md §6.7)")
@RestController
@RequestMapping("/v1/venues/{venueId}")
class PositioningConfigController(
    private val venueRepository: VenueRepository,
    private val beaconRepository: BeaconRepository,
) {

    @Operation(summary = "Beacon registry and calibration parameters for on-device positioning")
    @GetMapping("/positioning-config")
    fun getPositioningConfig(
        @PathVariable venueId: UUID,
        @RequestParam(required = false) mapVersionId: UUID?,
    ): Map<String, Any?> {
        val venue = venueRepository.findById(venueId)
            .orElseThrow { NotFoundException("Venue not found") }
        val versionId = mapVersionId ?: venue.publishedMapVersionId
            ?: throw NotFoundException("Venue has no published map version")

        val beacons = beaconRepository.findByMapVersionIdAndActiveTrue(versionId)
        return mapOf(
            "venueId" to venue.id,
            "mapVersionId" to versionId,
            "beacons" to beacons.map {
                mapOf(
                    "id" to it.id,
                    "floorId" to it.floorId,
                    "uuid" to it.beaconUuid,
                    "major" to it.major,
                    "minor" to it.minor,
                    "x" to it.x,
                    "y" to it.y,
                    "referenceRssiAt1m" to it.referenceRssiAt1m,
                    "pathLossExponent" to it.pathLossExponent,
                )
            },
        )
    }
}
