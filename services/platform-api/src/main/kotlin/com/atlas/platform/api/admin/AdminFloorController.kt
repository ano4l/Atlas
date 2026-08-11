package com.atlas.platform.api.admin

import com.atlas.platform.domain.Floor
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.FloorRepository
import com.atlas.platform.repo.MapVersionRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
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

@Tag(name = "Admin — maps", description = "Floor management within a map version (techspec.md §9.2)")
@RestController
@RequestMapping("/v1/admin/maps/{mapVersionId}/floors")
class AdminFloorController(
    private val mapVersionRepository: MapVersionRepository,
    private val floorRepository: FloorRepository,
) {

    data class CreateFloorRequest(
        @field:NotBlank val name: String,
        val ordinal: Int,
        val publicLabel: String? = null,
        val localBounds: String? = null,
        val sourceScale: Double? = null,
    )

    @Operation(summary = "List floors in a map version")
    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR','VENUE_ADMIN')")
    fun listFloors(@PathVariable mapVersionId: UUID): List<Floor> =
        floorRepository.findByMapVersionId(mapVersionId)

    @Operation(summary = "Add a floor to a draft map version")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun createFloor(
        @PathVariable mapVersionId: UUID,
        @Valid @RequestBody request: CreateFloorRequest,
    ): Floor {
        val mapVersion = mapVersionRepository.findById(mapVersionId)
            .orElseThrow { NotFoundException("Map version not found") }
        if (mapVersion.status != com.atlas.platform.domain.MapVersionStatus.draft) {
            throw BadRequestException("Floors can only be added to draft map versions")
        }
        return floorRepository.save(
            Floor(
                mapVersionId = mapVersionId,
                venueId = mapVersion.venueId,
                name = request.name,
                ordinal = request.ordinal,
                publicLabel = request.publicLabel,
                localBounds = request.localBounds,
                sourceScale = request.sourceScale,
            )
        )
    }
}
