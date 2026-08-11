package com.atlas.platform.api.admin

import com.atlas.platform.domain.MapVersionStatus
import com.atlas.platform.domain.PointOfInterest
import com.atlas.platform.domain.PoiStatus
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.PointOfInterestRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Admin — POIs", description = "POI, alias, category and status management (techspec.md §9.2)")
@RestController
@RequestMapping("/v1/admin/pois")
class AdminPoiController(
    private val mapVersionRepository: MapVersionRepository,
    private val poiRepository: PointOfInterestRepository,
) {

    private val mapper = jacksonObjectMapper()

    data class CreatePoiRequest(
        @field:NotBlank val name: String,
        val floorId: UUID,
        val aliases: List<String> = emptyList(),
        val categoryId: UUID? = null,
        val subcategory: String? = null,
        val visualAnchorX: Double? = null,
        val visualAnchorY: Double? = null,
        val entryPointNodeId: UUID? = null,
        val searchKeywords: List<String> = emptyList(),
    )

    data class UpdatePoiStatusRequest(val status: PoiStatus)

    @Operation(summary = "List POIs for a map version")
    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR','VENUE_ADMIN')")
    fun listPois(mapVersionId: UUID): List<PointOfInterest> =
        poiRepository.findByMapVersionId(mapVersionId)

    @Operation(summary = "Create a POI in a draft map version")
    @PostMapping("/map-versions/{mapVersionId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun createPoi(
        @PathVariable mapVersionId: UUID,
        @Valid @RequestBody request: CreatePoiRequest,
    ): PointOfInterest {
        val mapVersion = mapVersionRepository.findById(mapVersionId)
            .orElseThrow { NotFoundException("Map version not found") }
        if (mapVersion.status != MapVersionStatus.draft) {
            throw BadRequestException("POIs can only be added to draft map versions")
        }
        return poiRepository.save(
            PointOfInterest(
                mapVersionId = mapVersionId,
                venueId = mapVersion.venueId,
                floorId = request.floorId,
                name = request.name,
                aliases = mapper.writeValueAsString(request.aliases),
                categoryId = request.categoryId,
                subcategory = request.subcategory,
                visualAnchorX = request.visualAnchorX,
                visualAnchorY = request.visualAnchorY,
                entryPointNodeId = request.entryPointNodeId,
                searchKeywords = mapper.writeValueAsString(request.searchKeywords),
            )
        )
    }

    @Operation(summary = "Update a POI's operating status (open / temporarily closed / closed)")
    @PatchMapping("/{poiId}/status")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR','VENUE_ADMIN')")
    fun updateStatus(
        @PathVariable poiId: UUID,
        @Valid @RequestBody request: UpdatePoiStatusRequest,
    ): PointOfInterest {
        val poi = poiRepository.findById(poiId).orElseThrow { NotFoundException("POI not found") }
        poi.status = request.status
        return poiRepository.save(poi)
    }
}
