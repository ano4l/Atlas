package com.atlas.platform.routing

import com.atlas.platform.domain.ClosureState
import com.atlas.platform.domain.NavigationEdge
import com.atlas.platform.domain.NavigationNode
import com.atlas.platform.domain.PointOfInterest
import com.atlas.platform.domain.PoiStatus
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.NavigationEdgeRepository
import com.atlas.platform.repo.NavigationNodeRepository
import com.atlas.platform.repo.PointOfInterestRepository
import com.atlas.platform.repo.VenueRepository
import org.springframework.stereotype.Service
import java.time.OffsetDateTime
import java.util.PriorityQueue
import java.util.UUID
import kotlin.math.hypot

// Route calculation per techspec.md §7.4: A* over the navigation graph with
// a straight-line (Euclidean) admissible heuristic. Constraint resolution
// (restricted edges, closures, one-way, validity windows) happens at graph
// load time, before search — mirroring packages/routing-core TS logic.

data class RouteRequest(
    val mapVersionId: UUID,
    val start: RoutePoint,
    val destinationPoiId: UUID,
    val mode: String = "shortest",
    val constraints: List<String> = emptyList(),
    val allowCommercialInfluence: Boolean = false,
)

data class RoutePoint(
    val floorId: UUID,
    val x: Double,
    val y: Double,
    val accuracyM: Double? = null,
)

data class RouteFloorSegment(
    val floorId: UUID,
    val polyline: List<List<Double>>,
    val instructions: List<String> = emptyList(),
)

data class RouteFloorTransition(
    val fromFloorId: UUID,
    val toFloorId: UUID,
    val transitionType: String,
    val instruction: String,
)

data class RouteResponse(
    val routeId: UUID,
    val mapVersionId: UUID,
    val distanceM: Double,
    val estimatedTimeS: Long,
    val commerciallyInfluenced: Boolean,
    val floors: List<RouteFloorSegment>,
    val transitions: List<RouteFloorTransition>,
)

@Service
class RouteService(
    private val venueRepository: VenueRepository,
    private val mapVersionRepository: MapVersionRepository,
    private val nodeRepository: NavigationNodeRepository,
    private val edgeRepository: NavigationEdgeRepository,
    private val poiRepository: PointOfInterestRepository,
) {

    companion object {
        const val WALKING_SPEED_MPS = 1.2
    }

    fun calculateRoute(venueId: UUID, request: RouteRequest): RouteResponse {
        venueRepository.findById(venueId).orElseThrow { NotFoundException("Venue not found") }
        val mapVersion = mapVersionRepository.findById(request.mapVersionId)
            .orElseThrow { NotFoundException("Map version not found") }
        if (mapVersion.venueId != venueId) {
            throw BadRequestException("Map version does not belong to this venue")
        }

        val poi = poiRepository.findById(request.destinationPoiId)
            .orElseThrow { NotFoundException("Destination POI not found") }
        if (poi.venueId != venueId || poi.mapVersionId != request.mapVersionId) {
            throw BadRequestException("Destination does not belong to the requested venue and map version")
        }

        if (poi.status == PoiStatus.closed) {
            throw BadRequestException("Destination is closed")
        }

        val destinationNodeId = poi.entryPointNodeId
            ?: throw BadRequestException("Destination has no routable entry point")

        val nodes = nodeRepository.findByMapVersionIdAndActiveTrue(request.mapVersionId)
            .associateBy { it.id }
        val now = OffsetDateTime.now()
        val edges = edgeRepository.findByMapVersionId(request.mapVersionId)
            .filter { it.closureState == ClosureState.open }
            .filter { !it.restricted || request.constraints.contains("allow_restricted") }
            .filter { it.validFrom == null || !it.validFrom!!.isAfter(now) }
            .filter { it.validUntil == null || !it.validUntil!!.isBefore(now) }

        val startNode = nearestNode(nodes.values, request.start.floorId, request.start.x, request.start.y)
            ?: throw BadRequestException("No navigable node near the requested start position")
        val destinationNode = nodes[destinationNodeId]
            ?: throw BadRequestException("Destination entry node is not part of this map version")

        val pathNodeIds = aStar(nodes.values, edges, startNode.id, destinationNode.id)
            ?: throw BadRequestException("No route found between the requested points")

        return buildResponse(request.mapVersionId, pathNodeIds, nodes, edges)
    }

    private fun nearestNode(
        nodes: Collection<NavigationNode>,
        floorId: UUID,
        x: Double,
        y: Double,
    ): NavigationNode? = nodes
        .filter { it.floorId == floorId }
        .minByOrNull { hypot(it.x - x, it.y - y) }

    private fun buildAdjacency(
        edges: List<NavigationEdge>,
    ): Map<UUID, List<Pair<UUID, NavigationEdge>>> {
        val adjacency = mutableMapOf<UUID, MutableList<Pair<UUID, NavigationEdge>>>()
        for (edge in edges) {
            adjacency.getOrPut(edge.fromNodeId) { mutableListOf() }.add(edge.toNodeId to edge)
            if (!edge.oneWay) {
                adjacency.getOrPut(edge.toNodeId) { mutableListOf() }.add(edge.fromNodeId to edge)
            }
        }
        return adjacency
    }

    fun aStar(
        nodes: Collection<NavigationNode>,
        edges: List<NavigationEdge>,
        startId: UUID,
        goalId: UUID,
    ): List<UUID>? {
        val nodesById = nodes.associateBy { it.id }
        val goal = nodesById[goalId] ?: return null
        val adjacency = buildAdjacency(edges)

        data class QueueEntry(val nodeId: UUID, val fScore: Double)

        val gScore = mutableMapOf<UUID, Double>().withDefault { Double.POSITIVE_INFINITY }
        val cameFrom = mutableMapOf<UUID, UUID>()
        val openSet = PriorityQueue<QueueEntry>(compareBy { it.fScore })
        val closed = mutableSetOf<UUID>()

        gScore[startId] = 0.0
        openSet.add(QueueEntry(startId, 0.0))

        while (openSet.isNotEmpty()) {
            val current = openSet.poll()
            if (current.nodeId in closed) continue
            if (current.nodeId == goalId) return reconstructPath(cameFrom, goalId)
            closed.add(current.nodeId)

            val currentNode = nodesById[current.nodeId] ?: continue
            for ((neighbourId, edge) in adjacency[current.nodeId].orEmpty()) {
                if (neighbourId in closed) continue
                val neighbour = nodesById[neighbourId] ?: continue
                val tentative = gScore.getValue(current.nodeId) + edge.baseCostM
                if (tentative < gScore.getValue(neighbourId)) {
                    gScore[neighbourId] = tentative
                    cameFrom[neighbourId] = current.nodeId
                    val h = hypot(neighbour.x - goal.x, neighbour.y - goal.y)
                    openSet.add(QueueEntry(neighbourId, tentative + h))
                }
            }
        }
        return null
    }

    private fun reconstructPath(cameFrom: Map<UUID, UUID>, goalId: UUID): List<UUID> {
        val path = mutableListOf(goalId)
        var current = goalId
        while (cameFrom.containsKey(current)) {
            current = cameFrom.getValue(current)
            path.add(current)
        }
        return path.reversed()
    }

    private fun buildResponse(
        mapVersionId: UUID,
        pathNodeIds: List<UUID>,
        nodes: Map<UUID, NavigationNode>,
        edges: List<NavigationEdge>,
    ): RouteResponse {
        val pathNodes = pathNodeIds.mapNotNull { nodes[it] }
        val distance = pathNodes.zipWithNext { a, b -> hypot(b.x - a.x, b.y - a.y) }.sum()

        val floorSegments = mutableListOf<RouteFloorSegment>()
        val transitions = mutableListOf<RouteFloorTransition>()

        var currentFloor: UUID? = null
        var currentPolyline = mutableListOf<List<Double>>()

        for (node in pathNodes) {
            if (currentFloor == null) {
                currentFloor = node.floorId
            }
            if (node.floorId != currentFloor) {
                floorSegments.add(RouteFloorSegment(currentFloor!!, currentPolyline.toList()))
                currentPolyline = mutableListOf()
                currentFloor = node.floorId
            }
            currentPolyline.add(listOf(node.x, node.y))
        }
        if (currentFloor != null && currentPolyline.isNotEmpty()) {
            floorSegments.add(RouteFloorSegment(currentFloor!!, currentPolyline.toList()))
        }

        // Detect floor transitions from the path (nodes on different floors
        // connected via transition edges).
        val nodeById = pathNodeIds.mapNotNull { id -> nodes[id]?.let { id to it } }.toMap()
        for (i in 0 until pathNodeIds.size - 1) {
            val from = nodeById[pathNodeIds[i]] ?: continue
            val to = nodeById[pathNodeIds[i + 1]] ?: continue
            if (from.floorId != to.floorId) {
                val edge = edges.firstOrNull { e ->
                    (e.fromNodeId == from.id && e.toNodeId == to.id) ||
                        (e.fromNodeId == to.id && e.toNodeId == from.id)
                }
                val transitionType = edge?.edgeType ?: "unknown"
                transitions.add(
                    RouteFloorTransition(
                        fromFloorId = from.floorId,
                        toFloorId = to.floorId,
                        transitionType = transitionType,
                        instruction = "Take the $transitionType to continue",
                    )
                )
            }
        }

        return RouteResponse(
            routeId = UUID.randomUUID(),
            mapVersionId = mapVersionId,
            distanceM = Math.round(distance * 10.0) / 10.0,
            estimatedTimeS = (distance / WALKING_SPEED_MPS).toLong(),
            commerciallyInfluenced = false,
            floors = floorSegments,
            transitions = transitions,
        )
    }

    /** Used by the validation/publishing workflow to sanity-check connectivity. */
    fun isGraphConnected(nodes: Collection<NavigationNode>, edges: List<NavigationEdge>): Boolean {
        if (nodes.isEmpty()) return true
        val adjacency = buildAdjacency(edges)
        val visited = mutableSetOf<UUID>()
        val stack = ArrayDeque<UUID>()
        stack.add(nodes.first().id)
        while (stack.isNotEmpty()) {
            val current = stack.removeLast()
            if (!visited.add(current)) continue
            for ((neighbourId, _) in adjacency[current].orEmpty()) {
                if (neighbourId !in visited) stack.add(neighbourId)
            }
        }
        return visited.size == nodes.size
    }

    /** Quick helper for diagnostics: reports which nodes are unreachable. */
    fun unreachableNodes(nodes: Collection<NavigationNode>, edges: List<NavigationEdge>): List<UUID> {
        if (nodes.isEmpty()) return emptyList()
        val adjacency = buildAdjacency(edges)
        val visited = mutableSetOf<UUID>()
        val stack = ArrayDeque<UUID>()
        stack.add(nodes.first().id)
        while (stack.isNotEmpty()) {
            val current = stack.removeLast()
            if (!visited.add(current)) continue
            for ((neighbourId, _) in adjacency[current].orEmpty()) {
                if (neighbourId !in visited) stack.add(neighbourId)
            }
        }
        return nodes.map { it.id }.filter { it !in visited }
    }
}
