package com.atlas.platform.api.admin

import com.atlas.platform.domain.Beacon
import com.atlas.platform.domain.MapVersionStatus
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.BeaconRepository
import com.atlas.platform.repo.FloorRepository
import com.atlas.platform.repo.MapVersionRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Admin — beacons", description = "Beacon registry and calibration parameters")
@RestController
@RequestMapping("/v1/admin/maps/{mapVersionId}/beacons")
class AdminBeaconController(
    private val mapVersionRepository: MapVersionRepository,
    private val floorRepository: FloorRepository,
    private val beaconRepository: BeaconRepository,
) {
    data class CreateBeaconRequest(
        val floorId: UUID,
        @field:NotBlank val beaconUuid: String,
        val major: Int? = null,
        val minor: Int? = null,
        val x: Double,
        val y: Double,
        val referenceRssiAt1m: Int = -59,
        @field:Positive val pathLossExponent: Double = 2.0,
    )

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR','VENUE_ADMIN')")
    fun list(@PathVariable mapVersionId: UUID): List<Beacon> =
        beaconRepository.findByMapVersionId(mapVersionId)

    @Operation(summary = "Register a beacon on a draft map version")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun create(
        @PathVariable mapVersionId: UUID,
        @Valid @RequestBody request: CreateBeaconRequest,
    ): Beacon {
        val mapVersion = mapVersionRepository.findById(mapVersionId)
            .orElseThrow { NotFoundException("Map version not found") }
        if (mapVersion.status != MapVersionStatus.draft) {
            throw BadRequestException("Beacons can only be added to draft map versions")
        }
        val floor = floorRepository.findById(request.floorId)
            .orElseThrow { NotFoundException("Floor not found") }
        if (floor.mapVersionId != mapVersionId) {
            throw BadRequestException("Floor does not belong to this map version")
        }
        return beaconRepository.save(
            Beacon(
                mapVersionId = mapVersionId,
                floorId = request.floorId,
                beaconUuid = request.beaconUuid,
                major = request.major,
                minor = request.minor,
                x = request.x,
                y = request.y,
                referenceRssiAt1m = request.referenceRssiAt1m,
                pathLossExponent = request.pathLossExponent,
            )
        )
    }
}
