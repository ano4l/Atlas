package com.atlas.platform.mappackage

import com.atlas.platform.domain.NavigationEdge
import com.atlas.platform.domain.NavigationNode
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.repo.FloorRepository
import com.atlas.platform.repo.NavigationEdgeRepository
import com.atlas.platform.repo.NavigationNodeRepository
import com.atlas.platform.repo.PointOfInterestRepository
import com.atlas.platform.routing.RouteService
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class MapPackageValidationService(
    private val floorRepository: FloorRepository,
    private val nodeRepository: NavigationNodeRepository,
    private val edgeRepository: NavigationEdgeRepository,
    private val poiRepository: PointOfInterestRepository,
    private val routeService: RouteService,
) {
    private val transitionEdgeTypes = setOf("stairs", "escalator", "lift", "ramp")

    fun validateSource(request: MapPackageImportRequest): MapValidationReport {
        val issues = mutableListOf<MapValidationIssue>()
        fun issue(code: String, path: String, message: String) = issues.add(MapValidationIssue(code, path, message))

        if (request.schemaVersion != 1) issue("UNSUPPORTED_SCHEMA", "schemaVersion", "Only schemaVersion 1 is supported")
        if (request.mapVersion.venueId != request.venue.id) issue("CROSS_VENUE_REFERENCE", "mapVersion.venueId", "Map version must reference the package venue")

        val allIds = buildList {
            add(request.venue.id)
            add(request.mapVersion.id)
            addAll(request.floors.map { it.id })
            addAll(request.nodes.map { it.id })
            addAll(request.edges.map { it.id })
            addAll(request.pois.map { it.id })
        }
        allIds.groupingBy { it }.eachCount().filterValues { it > 1 }.keys.forEach {
            issue("DUPLICATE_SOURCE_ID", "sourceId", "Source ID '$it' is used more than once")
        }

        val floors = request.floors.associateBy { it.id }
        val nodes = request.nodes.associateBy { it.id }
        request.floors.forEachIndexed { index, floor ->
            if (floor.venueId != request.venue.id) issue("CROSS_VENUE_REFERENCE", "floors[$index].venueId", "Floor belongs to another venue")
        }
        request.nodes.forEachIndexed { index, node ->
            if (!node.x.isFinite() || !node.y.isFinite()) issue("INVALID_COORDINATE", "nodes[$index]", "Node coordinates must be finite")
            if (node.floorId !in floors) issue("UNKNOWN_FLOOR", "nodes[$index].floorId", "Unknown floor '${node.floorId}'")
        }
        request.edges.forEachIndexed { index, edge ->
            val from = nodes[edge.fromNodeId]
            val to = nodes[edge.toNodeId]
            if (from == null) issue("UNKNOWN_NODE", "edges[$index].fromNodeId", "Unknown node '${edge.fromNodeId}'")
            if (to == null) issue("UNKNOWN_NODE", "edges[$index].toNodeId", "Unknown node '${edge.toNodeId}'")
            if (!edge.distanceM.isFinite() || edge.distanceM <= 0) issue("INVALID_EDGE_COST", "edges[$index].distanceM", "Edge cost must be positive and finite")
            if (edge.fromNodeId == edge.toNodeId) issue("SELF_EDGE", "edges[$index]", "An edge cannot connect a node to itself")
            if (from != null && to != null && from.floorId != to.floorId && edge.edgeType !in transitionEdgeTypes) {
                issue("INVALID_FLOOR_TRANSITION", "edges[$index].edgeType", "Cross-floor edges must be stairs, escalator, lift, or ramp")
            }
            if (edge.directionality !in setOf("bidirectional", "forward", "backward")) {
                issue("INVALID_DIRECTIONALITY", "edges[$index].directionality", "Unsupported directionality '${edge.directionality}'")
            }
        }
        request.pois.forEachIndexed { index, poi ->
            if (poi.venueId != request.venue.id) issue("CROSS_VENUE_REFERENCE", "pois[$index].venueId", "POI belongs to another venue")
            if (poi.floorId !in floors) issue("UNKNOWN_FLOOR", "pois[$index].floorId", "Unknown floor '${poi.floorId}'")
            if (poi.entranceNodeIds.isEmpty()) issue("UNROUTABLE_POI", "pois[$index].entranceNodeIds", "Every POI requires a routable entrance")
            poi.entranceNodeIds.forEach { entranceId ->
                val entrance = nodes[entranceId]
                if (entrance == null) issue("UNKNOWN_NODE", "pois[$index].entranceNodeIds", "Unknown entrance node '$entranceId'")
                else if (entrance.floorId != poi.floorId) issue("CROSS_FLOOR_REFERENCE", "pois[$index].entranceNodeIds", "POI entrance must be on the POI floor")
            }
        }
        return MapValidationReport(issues.isEmpty(), issues)
    }

    fun validatePersisted(mapVersionId: UUID): MapValidationReport {
        val issues = mutableListOf<MapValidationIssue>()
        fun issue(code: String, path: String, message: String) = issues.add(MapValidationIssue(code, path, message))
        val floors = floorRepository.findByMapVersionId(mapVersionId)
        val nodes = nodeRepository.findByMapVersionIdAndActiveTrue(mapVersionId)
        val edges = edgeRepository.findByMapVersionId(mapVersionId)
        val pois = poiRepository.findByMapVersionId(mapVersionId)
        val floorsById = floors.associateBy { it.id }
        val nodesById = nodes.associateBy { it.id }

        if (floors.isEmpty()) issue("NO_FLOORS", "floors", "At least one floor is required")
        if (nodes.isEmpty() || edges.isEmpty()) issue("EMPTY_GRAPH", "navigationGraph", "Navigation graph must contain nodes and edges")
        if (nodes.isNotEmpty() && edges.isNotEmpty()) {
            routeService.unreachableNodes(nodes, edges).forEach { issue("UNREACHABLE_NODE", "nodes.$it", "Node is unreachable") }
        }
        edges.forEach { edge -> validatePersistedEdge(edge, nodesById, issues) }
        pois.forEach { poi ->
            val floor = floorsById[poi.floorId]
            val entrance = poi.entryPointNodeId?.let(nodesById::get)
            if (floor == null) issue("CROSS_VERSION_FLOOR", "pois.${poi.id}.floorId", "POI floor is outside this map version")
            if (entrance == null) issue("UNROUTABLE_POI", "pois.${poi.id}.entryPointNodeId", "POI has no valid routable entrance")
            else if (entrance.floorId != poi.floorId || entrance.mapVersionId != mapVersionId) {
                issue("CROSS_VERSION_ENTRANCE", "pois.${poi.id}.entryPointNodeId", "POI entrance must belong to its floor and map version")
            }
        }
        return MapValidationReport(issues.isEmpty(), issues)
    }

    fun requireValid(report: MapValidationReport) {
        if (!report.valid) {
            val summary = report.issues.joinToString("; ") { "${it.code} at ${it.path}: ${it.message}" }
            throw BadRequestException("Map package validation failed: $summary")
        }
    }

    private fun validatePersistedEdge(edge: NavigationEdge, nodes: Map<UUID, NavigationNode>, issues: MutableList<MapValidationIssue>) {
        val from = nodes[edge.fromNodeId]
        val to = nodes[edge.toNodeId]
        if (!edge.baseCostM.isFinite() || edge.baseCostM <= 0) issues.add(MapValidationIssue("INVALID_EDGE_COST", "edges.${edge.id}.baseCostM", "Edge cost must be positive and finite"))
        if (from == null || to == null) issues.add(MapValidationIssue("CROSS_VERSION_EDGE", "edges.${edge.id}", "Edge endpoints must belong to this map version"))
        else if (from.floorId != to.floorId && edge.edgeType !in transitionEdgeTypes) {
            issues.add(MapValidationIssue("INVALID_FLOOR_TRANSITION", "edges.${edge.id}.edgeType", "Cross-floor edges must use transition types"))
        }
    }
}
