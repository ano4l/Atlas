package com.atlas.platform.api.admin

import com.atlas.platform.domain.AuditLogEntry
import com.atlas.platform.domain.MapVersion
import com.atlas.platform.domain.MapVersionStatus
import com.atlas.platform.domain.Venue
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.errors.ConflictException
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.AuditLogRepository
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.VenueRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Tag(name = "Admin — venues", description = "Venue management (techspec.md §9.2)")
@RestController
@RequestMapping("/v1/admin/venues")
class AdminVenueController(
    private val venueRepository: VenueRepository,
    private val mapVersionRepository: MapVersionRepository,
    private val auditLogRepository: AuditLogRepository,
) {

    private val mapper = jacksonObjectMapper()

    data class CreateVenueRequest(
        @field:NotBlank val slug: String,
        @field:NotBlank val name: String,
        @field:NotBlank val displayName: String,
        val category: String? = null,
        val description: String? = null,
    )

    @Operation(summary = "List all venues (admin)")
    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR','VENUE_ADMIN')")
    fun listAll(): List<Venue> = venueRepository.findAll()

    @Operation(summary = "Create a venue")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun createVenue(
        @Valid @RequestBody request: CreateVenueRequest,
        @AuthenticationPrincipal actor: String?,
    ): Venue {
        if (venueRepository.findAll().any { it.slug == request.slug }) {
            throw ConflictException("Slug '${request.slug}' is already in use")
        }
        val venue = venueRepository.save(
            Venue(
                slug = request.slug,
                name = request.name,
                displayName = request.displayName,
                category = request.category,
                description = request.description,
            )
        )
        audit(actor, "venue.create", "venue", venue.id.toString(), mapOf("slug" to venue.slug))
        return venue
    }

    @Operation(summary = "Create a new draft map version for a venue")
    @PostMapping("/{venueId}/map-versions")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun createMapVersion(
        @PathVariable venueId: UUID,
        @AuthenticationPrincipal actor: String?,
    ): MapVersion {
        venueRepository.findById(venueId).orElseThrow { NotFoundException("Venue not found") }
        val nextVersion = (mapVersionRepository.findTopByVenueIdOrderByVersionDesc(venueId)
            .map { it.version }.orElse(0)) + 1
        val mapVersion = mapVersionRepository.save(
            MapVersion(venueId = venueId, version = nextVersion, createdBy = actor)
        )
        audit(actor, "map_version.create", "map_version", mapVersion.id.toString(), mapOf("venueId" to venueId.toString(), "version" to nextVersion))
        return mapVersion
    }

    @Operation(summary = "Publish a map version (atomic switch of the venue's published version)")
    @PostMapping("/{venueId}/map-versions/{mapVersionId}/publish")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    @Transactional
    fun publishMapVersion(
        @PathVariable venueId: UUID,
        @PathVariable mapVersionId: UUID,
        @AuthenticationPrincipal actor: String?,
    ): MapVersion {
        val venue = venueRepository.findById(venueId).orElseThrow { NotFoundException("Venue not found") }
        val mapVersion = mapVersionRepository.findById(mapVersionId)
            .orElseThrow { NotFoundException("Map version not found") }
        if (mapVersion.venueId != venueId) {
            throw BadRequestException("Map version does not belong to this venue")
        }
        if (mapVersion.status == MapVersionStatus.published) {
            throw ConflictException("Map version is already published")
        }

        // Retire the currently published version, then publish atomically.
        mapVersionRepository.findByVenueIdAndStatus(venueId, MapVersionStatus.published)
            .forEach {
                it.status = MapVersionStatus.retired
                mapVersionRepository.save(it)
            }

        mapVersion.status = MapVersionStatus.published
        mapVersion.publishedAt = OffsetDateTime.now()
        val saved = mapVersionRepository.save(mapVersion)

        venue.publishedMapVersionId = saved.id
        venue.updatedAt = OffsetDateTime.now()
        venueRepository.save(venue)

        audit(actor, "map_version.publish", "map_version", mapVersionId.toString(), mapOf("venueId" to venueId.toString()))
        return saved
    }

    @Operation(summary = "Roll back the venue to a previously published map version")
    @PostMapping("/{venueId}/map-versions/{mapVersionId}/rollback")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    @Transactional
    fun rollbackMapVersion(
        @PathVariable venueId: UUID,
        @PathVariable mapVersionId: UUID,
        @AuthenticationPrincipal actor: String?,
    ): MapVersion {
        val venue = venueRepository.findById(venueId).orElseThrow { NotFoundException("Venue not found") }
        val target = mapVersionRepository.findById(mapVersionId)
            .orElseThrow { NotFoundException("Map version not found") }
        if (target.venueId != venueId) {
            throw BadRequestException("Map version does not belong to this venue")
        }

        mapVersionRepository.findByVenueIdAndStatus(venueId, MapVersionStatus.published)
            .filter { it.id != mapVersionId }
            .forEach {
                it.status = MapVersionStatus.retired
                mapVersionRepository.save(it)
            }

        target.status = MapVersionStatus.published
        target.publishedAt = OffsetDateTime.now()
        val saved = mapVersionRepository.save(target)

        venue.publishedMapVersionId = saved.id
        venue.updatedAt = OffsetDateTime.now()
        venueRepository.save(venue)

        audit(actor, "map_version.rollback", "map_version", mapVersionId.toString(), mapOf("venueId" to venueId.toString()))
        return saved
    }

    private fun audit(actor: String?, action: String, entityType: String, entityId: String?, details: Map<String, Any?>) {
        auditLogRepository.save(
            AuditLogEntry(
                actor = actor ?: "unknown",
                action = action,
                entityType = entityType,
                entityId = entityId,
                details = mapper.writeValueAsString(details),
            )
        )
    }
}
