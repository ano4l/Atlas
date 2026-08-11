package com.atlas.platform.api.admin

import com.atlas.platform.domain.MapVersionStatus
import com.atlas.platform.domain.PointOfInterest
import com.atlas.platform.domain.PoiStatus
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.FloorRepository
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.NavigationNodeRepository
import com.atlas.platform.repo.PointOfInterestRepository
import com.fasterxml.jackson.databind.ObjectMapper
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

@Tag(name = "Admin — points of interest", description = "POI and destination management")
@RestController
@RequestMapping("/v1/admin/maps/{mapVersionId}/pois")
class AdminPointOfInterestController(
    private val mapVersionRepository: MapVersionRepository,
    private val floorRepository: FloorRepository,
    private val nodeRepository: NavigationNodeRepository,
    private val poiRepository: PointOfInterestRepository,
    private val objectMapper: ObjectMapper,
) {
    data class CreatePoiRequest(
        val floorId: UUID,
        @field:NotBlank val name: String,
        val aliases: List<String> = emptyList(),
        val searchKeywords: List<String> = emptyList(),
        val categoryId: UUID? = null,
        val subcategory: String? = null,
        val visualAnchorX: Double? = null,
        val visualAnchorY: Double? = null,
        val entryPointNodeId: UUID? = null,
        val status: PoiStatus = PoiStatus.open,
        val accessibilityNotes: String? = null,
    )

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR','VENUE_ADMIN')")
    fun list(@PathVariable mapVersionId: UUID): List<PointOfInterest> =
        poiRepository.findByMapVersionId(mapVersionId)

    @Operation(summary = "Add a routable POI to a draft map version")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun create(
        @PathVariable mapVersionId: UUID,
        @Valid @RequestBody request: CreatePoiRequest,
    ): PointOfInterest {
        val mapVersion = mapVersionRepository.findById(mapVersionId)
            .orElseThrow { NotFoundException("Map version not found") }
        if (mapVersion.status != MapVersionStatus.draft) {
            throw BadRequestException("POIs can only be added to draft map versions")
        }
        val floor = floorRepository.findById(request.floorId)
            .orElseThrow { NotFoundException("Floor not found") }
        if (floor.mapVersionId != mapVersionId) {
            throw BadRequestException("Floor does not belong to this map version")
        }
        request.entryPointNodeId?.let { nodeId ->
            val node = nodeRepository.findById(nodeId)
                .orElseThrow { NotFoundException("Entry point node not found") }
            if (node.mapVersionId != mapVersionId || node.floorId != request.floorId) {
                throw BadRequestException("Entry point node must belong to this map version and floor")
            }
        }
        return poiRepository.save(
            PointOfInterest(
                mapVersionId = mapVersionId,
                venueId = mapVersion.venueId,
                floorId = request.floorId,
                name = request.name,
                aliases = objectMapper.writeValueAsString(request.aliases),
                categoryId = request.categoryId,
                subcategory = request.subcategory,
                visualAnchorX = request.visualAnchorX,
                visualAnchorY = request.visualAnchorY,
                entryPointNodeId = request.entryPointNodeId,
                searchKeywords = objectMapper.writeValueAsString(request.searchKeywords),
                status = request.status,
                accessibilityNotes = request.accessibilityNotes,
            )
        )
    }
}
