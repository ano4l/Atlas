package com.atlas.platform.mappackage

import com.atlas.platform.domain.MapVersionStatus
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.BeaconRepository
import com.atlas.platform.repo.FloorRepository
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.NavigationEdgeRepository
import com.atlas.platform.repo.NavigationNodeRepository
import com.atlas.platform.repo.PointOfInterestRepository
import com.atlas.platform.repo.VenueRepository
import com.atlas.platform.routing.isStepFree
import org.springframework.stereotype.Service
import java.util.UUID

// Assembles one internally consistent venue package from a single map
// version (techspec.md §9.3: clients must never receive a mixture of graph
// and POI versions). Signing/integrity envelopes land with §13 hardening.
@Service
class MapPackageService(
    private val venueRepository: VenueRepository,
    private val mapVersionRepository: MapVersionRepository,
    private val floorRepository: FloorRepository,
    private val poiRepository: PointOfInterestRepository,
    private val nodeRepository: NavigationNodeRepository,
    private val edgeRepository: NavigationEdgeRepository,
    private val beaconRepository: BeaconRepository,
) {

    fun buildPackage(venueId: UUID, requestedMapVersionId: UUID?): Map<String, Any?> {
        val venue = venueRepository.findById(venueId)
            .orElseThrow { NotFoundException("Venue not found") }

        val mapVersion = when {
            requestedMapVersionId != null -> mapVersionRepository.findById(requestedMapVersionId)
                .orElseThrow { NotFoundException("Map version not found") }
            venue.publishedMapVersionId != null -> mapVersionRepository.findById(venue.publishedMapVersionId!!)
                .orElseThrow { NotFoundException("Published map version not found") }
            else -> throw BadRequestException("Venue has no published map version")
        }
        if (mapVersion.venueId != venueId || mapVersion.status !in setOf(MapVersionStatus.published, MapVersionStatus.retired)) {
            throw NotFoundException("Map version not found")
        }

        val floors = floorRepository.findByMapVersionId(mapVersion.id)
        val pois = poiRepository.findByMapVersionId(mapVersion.id)
        val nodes = nodeRepository.findByMapVersionId(mapVersion.id)
        val edges = edgeRepository.findByMapVersionId(mapVersion.id)
        val beacons = beaconRepository.findByMapVersionIdAndActiveTrue(mapVersion.id)

        return mapOf(
            "venue" to mapOf(
                "id" to venue.id,
                "slug" to venue.slug,
                "name" to venue.name,
                "displayName" to venue.displayName,
                "category" to venue.category,
                "description" to venue.description,
                "defaultLocale" to venue.defaultLocale,
            ),
            "mapVersion" to mapOf(
                "id" to mapVersion.id,
                "version" to mapVersion.version,
                "status" to mapVersion.status.name,
                "publishedAt" to mapVersion.publishedAt,
                "minimumAppVersion" to mapVersion.minimumAppVersion,
            ),
            "floors" to floors.map {
                mapOf(
                    "id" to it.id,
                    "name" to it.name,
                    "ordinal" to it.ordinal,
                    "publicLabel" to it.publicLabel,
                    "localBounds" to it.localBounds,
                    "sourceScale" to it.sourceScale,
                )
            },
            "pois" to pois.map {
                mapOf(
                    "id" to it.id,
                    "floorId" to it.floorId,
                    "name" to it.name,
                    "aliases" to it.aliases,
                    "categoryId" to it.categoryId,
                    "subcategory" to it.subcategory,
                    "visualAnchor" to if (it.visualAnchorX != null && it.visualAnchorY != null)
                        listOf(it.visualAnchorX, it.visualAnchorY) else null,
                    "entryPointNodeId" to it.entryPointNodeId,
                    "status" to it.status.name,
                    "searchKeywords" to it.searchKeywords,
                )
            },
            "graph" to mapOf(
                "nodes" to nodes.filter { it.active }.map {
                    mapOf(
                        "id" to it.id,
                        "floorId" to it.floorId,
                        "x" to it.x,
                        "y" to it.y,
                        "nodeType" to it.nodeType,
                        "transitionGroupId" to it.transitionGroupId,
                    )
                },
                "edges" to edges.map {
                    mapOf(
                        "id" to it.id,
                        "fromNodeId" to it.fromNodeId,
                        "toNodeId" to it.toNodeId,
                        "edgeType" to it.edgeType,
                        "baseCostM" to it.baseCostM,
                        "isOneWay" to it.oneWay,
                        "isRestricted" to it.restricted,
                        "closureState" to it.closureState.name,
                        "validFrom" to it.validFrom,
                        "validUntil" to it.validUntil,
                        "isStepFree" to it.isStepFree(),
                        "geometry" to it.geometry,
                    )
                },
            ),
            "positioning" to mapOf(
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
            ),
        )
    }
}
