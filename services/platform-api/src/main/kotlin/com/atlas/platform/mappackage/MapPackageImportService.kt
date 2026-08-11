package com.atlas.platform.mappackage

import com.atlas.platform.domain.AuditLogEntry
import com.atlas.platform.domain.Floor
import com.atlas.platform.domain.MapVersion
import com.atlas.platform.domain.NavigationEdge
import com.atlas.platform.domain.NavigationNode
import com.atlas.platform.domain.PointOfInterest
import com.atlas.platform.domain.Venue
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.repo.AuditLogRepository
import com.atlas.platform.repo.FloorRepository
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.NavigationEdgeRepository
import com.atlas.platform.repo.NavigationNodeRepository
import com.atlas.platform.repo.PointOfInterestRepository
import com.atlas.platform.repo.VenueRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.util.UUID

@Service
class MapPackageImportService(
    private val venueRepository: VenueRepository,
    private val mapVersionRepository: MapVersionRepository,
    private val floorRepository: FloorRepository,
    private val nodeRepository: NavigationNodeRepository,
    private val edgeRepository: NavigationEdgeRepository,
    private val poiRepository: PointOfInterestRepository,
    private val auditLogRepository: AuditLogRepository,
    private val validationService: MapPackageValidationService,
    private val objectMapper: ObjectMapper,
) {
    @Transactional
    fun importPackage(request: MapPackageImportRequest, actor: String?): MapPackageImportResponse {
        val sourceValidation = validationService.validateSource(request)
        validationService.requireValid(sourceValidation)
        val checksum = checksum(request)

        val existing = mapVersionRepository.findByImportedSourceChecksum(checksum).orElse(null)
        if (existing != null) {
            return MapPackageImportResponse(
                created = false,
                checksum = checksum,
                venueId = existing.venueId,
                mapVersionId = existing.id,
                mapVersion = existing.version,
                mappings = SourceIdMappings(emptyMap(), emptyMap(), emptyMap(), emptyMap()),
            )
        }

        try {
            val venue = venueRepository.findBySlug(request.venue.slug).orElseGet {
                venueRepository.saveAndFlush(
                    Venue(
                        slug = request.venue.slug,
                        name = request.venue.name,
                        displayName = request.venue.displayName ?: request.venue.name,
                        category = request.venue.category,
                        description = request.venue.description,
                    )
                )
            }
            val nextVersion = (mapVersionRepository.findTopByVenueIdOrderByVersionDesc(venue.id)
                .map { it.version }.orElse(0)) + 1
            val mapVersion = mapVersionRepository.saveAndFlush(
                MapVersion(
                    venueId = venue.id,
                    version = nextVersion,
                    importedSourceChecksum = checksum,
                    createdBy = actor,
                    minimumAppVersion = request.mapVersion.minimumAppVersion,
                )
            )

            val floorMappings = linkedMapOf<String, UUID>()
            request.floors.forEach { source ->
                val saved = floorRepository.save(
                    Floor(
                        mapVersionId = mapVersion.id,
                        venueId = venue.id,
                        name = source.name,
                        ordinal = source.ordinal,
                        publicLabel = source.publicLabel,
                        localBounds = source.localBounds?.let(objectMapper::writeValueAsString),
                        sourceScale = source.sourceScale,
                    )
                )
                floorMappings[source.id] = saved.id
            }
            floorRepository.flush()

            val nodeMappings = linkedMapOf<String, UUID>()
            request.nodes.forEach { source ->
                val saved = nodeRepository.save(
                    NavigationNode(
                        mapVersionId = mapVersion.id,
                        floorId = floorMappings.getValue(source.floorId),
                        x = source.x,
                        y = source.y,
                        nodeType = source.nodeType,
                        transitionGroupId = source.transitionGroupId?.let(::stableUuid),
                    )
                )
                nodeMappings[source.id] = saved.id
            }
            nodeRepository.flush()

            val edgeMappings = linkedMapOf<String, UUID>()
            request.edges.forEach { source ->
                val reverse = source.directionality == "backward"
                val saved = edgeRepository.save(
                    NavigationEdge(
                        mapVersionId = mapVersion.id,
                        fromNodeId = nodeMappings.getValue(if (reverse) source.toNodeId else source.fromNodeId),
                        toNodeId = nodeMappings.getValue(if (reverse) source.fromNodeId else source.toNodeId),
                        edgeType = source.edgeType,
                        baseCostM = source.distanceM,
                        oneWay = source.directionality != "bidirectional",
                        restricted = source.isRestricted,
                        geometry = source.geometry?.let(objectMapper::writeValueAsString),
                        validFrom = source.validFrom,
                        validUntil = source.validUntil,
                    )
                )
                edgeMappings[source.id] = saved.id
            }
            edgeRepository.flush()

            val poiMappings = linkedMapOf<String, UUID>()
            request.pois.forEach { source ->
                val saved = poiRepository.save(
                    PointOfInterest(
                        mapVersionId = mapVersion.id,
                        venueId = venue.id,
                        floorId = floorMappings.getValue(source.floorId),
                        name = source.name,
                        aliases = objectMapper.writeValueAsString(source.aliases),
                        subcategory = source.categories.firstOrNull(),
                        entryPointNodeId = nodeMappings.getValue(source.entranceNodeIds.first()),
                        searchKeywords = objectMapper.writeValueAsString(source.keywords),
                        status = source.openingStatus,
                        accessibilityNotes = source.accessibilityMetadata?.toString(),
                    )
                )
                poiMappings[source.id] = saved.id
            }
            poiRepository.flush()

            val persistedValidation = validationService.validatePersisted(mapVersion.id)
            validationService.requireValid(persistedValidation)
            auditLogRepository.save(
                AuditLogEntry(
                    actor = actor ?: "unknown",
                    action = "map_package.import",
                    entityType = "map_version",
                    entityId = mapVersion.id.toString(),
                    details = objectMapper.writeValueAsString(
                        mapOf(
                            "checksum" to checksum,
                            "schemaVersion" to request.schemaVersion,
                            "floors" to floorMappings.size,
                            "nodes" to nodeMappings.size,
                            "edges" to edgeMappings.size,
                            "pois" to poiMappings.size,
                        )
                    ),
                )
            )
            return MapPackageImportResponse(
                created = true,
                checksum = checksum,
                venueId = venue.id,
                mapVersionId = mapVersion.id,
                mapVersion = mapVersion.version,
                mappings = SourceIdMappings(floorMappings, nodeMappings, edgeMappings, poiMappings),
            )
        } catch (exception: DataIntegrityViolationException) {
            throw BadRequestException("Map package violates database integrity constraints")
        }
    }

    private fun checksum(request: MapPackageImportRequest): String {
        val canonical = linkedMapOf<String, Any>(
            "schemaVersion" to request.schemaVersion,
            "venue" to request.venue,
            "mapVersion" to request.mapVersion,
            "floors" to request.floors.sortedBy { it.id },
            "nodes" to request.nodes.sortedBy { it.id },
            "edges" to request.edges.sortedBy { it.id },
            "pois" to request.pois.sortedBy { it.id },
        )
        return MessageDigest.getInstance("SHA-256")
            .digest(objectMapper.writeValueAsBytes(canonical))
            .joinToString("") { "%02x".format(it) }
    }

    private fun stableUuid(sourceId: String): UUID = runCatching { UUID.fromString(sourceId) }
        .getOrElse { UUID.nameUUIDFromBytes(sourceId.toByteArray()) }

}
