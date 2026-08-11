package com.atlas.platform.api.admin

import com.atlas.platform.domain.ClosureState
import com.atlas.platform.domain.MapVersionStatus
import com.atlas.platform.domain.NavigationEdge
import com.atlas.platform.domain.NavigationNode
import com.atlas.platform.errors.BadRequestException
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.NavigationEdgeRepository
import com.atlas.platform.repo.NavigationNodeRepository
import com.atlas.platform.routing.RouteService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Positive
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
import java.time.OffsetDateTime
import java.util.UUID

@Tag(name = "Admin — navigation graph", description = "Nodes, edges, closures, validation (techspec.md §9.2)")
@RestController
@RequestMapping("/v1/admin/navigation-graph")
class AdminNavigationGraphController(
    private val mapVersionRepository: MapVersionRepository,
    private val nodeRepository: NavigationNodeRepository,
    private val edgeRepository: NavigationEdgeRepository,
    private val routeService: RouteService,
) {

    data class NodeInput(
        val floorId: UUID,
        val x: Double,
        val y: Double,
        val nodeType: String = "corridor",
        val transitionGroupId: UUID? = null,
    )

    data class EdgeInput(
        val fromNodeId: UUID,
        val toNodeId: UUID,
        val edgeType: String = "walkway",
        @field:Positive val baseCostM: Double,
        val oneWay: Boolean = false,
        val restricted: Boolean = false,
        val geometry: String? = null,
    )

    data class BulkNodesRequest(@field:NotEmpty val nodes: List<NodeInput>)
    data class BulkEdgesRequest(@field:NotEmpty val edges: List<EdgeInput>)

    @Operation(summary = "Bulk-import nodes into a draft map version")
    @PostMapping("/{mapVersionId}/nodes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun importNodes(
        @PathVariable mapVersionId: UUID,
        @Valid @RequestBody request: BulkNodesRequest,
    ): Map<String, Any> {
        val mapVersion = requireDraft(mapVersionId)
        val saved = nodeRepository.saveAll(
            request.nodes.map {
                NavigationNode(
                    mapVersionId = mapVersion.id,
                    floorId = it.floorId,
                    x = it.x,
                    y = it.y,
                    nodeType = it.nodeType,
                    transitionGroupId = it.transitionGroupId,
                )
            }
        )
        return mapOf("created" to saved.size)
    }

    @Operation(summary = "Bulk-import edges into a draft map version")
    @PostMapping("/{mapVersionId}/edges")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun importEdges(
        @PathVariable mapVersionId: UUID,
        @Valid @RequestBody request: BulkEdgesRequest,
    ): Map<String, Any> {
        val mapVersion = requireDraft(mapVersionId)
        val nodeIds = nodeRepository.findByMapVersionId(mapVersionId).map { it.id }.toSet()
        val saved = edgeRepository.saveAll(
            request.edges.map { edge ->
                if (edge.fromNodeId !in nodeIds || edge.toNodeId !in nodeIds) {
                    throw BadRequestException("Edge references a node outside this map version")
                }
                NavigationEdge(
                    mapVersionId = mapVersion.id,
                    fromNodeId = edge.fromNodeId,
                    toNodeId = edge.toNodeId,
                    edgeType = edge.edgeType,
                    baseCostM = edge.baseCostM,
                    oneWay = edge.oneWay,
                    restricted = edge.restricted,
                    geometry = edge.geometry,
                )
            }
        )
        return mapOf("created" to saved.size)
    }

    @Operation(summary = "Validate graph connectivity for a map version")
    @GetMapping("/{mapVersionId}/validate")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun validateGraph(@PathVariable mapVersionId: UUID): Map<String, Any> {
        mapVersionRepository.findById(mapVersionId).orElseThrow { NotFoundException("Map version not found") }
        val nodes = nodeRepository.findByMapVersionIdAndActiveTrue(mapVersionId)
        val edges = edgeRepository.findByMapVersionId(mapVersionId)
            .filter { it.closureState == ClosureState.open }
        val unreachable = routeService.unreachableNodes(nodes, edges)
        return mapOf(
            "mapVersionId" to mapVersionId,
            "nodeCount" to nodes.size,
            "edgeCount" to edges.size,
            "connected" to unreachable.isEmpty(),
            "unreachableNodeIds" to unreachable,
        )
    }

    private fun requireDraft(mapVersionId: UUID) =
        mapVersionRepository.findById(mapVersionId)
            .orElseThrow { NotFoundException("Map version not found") }
            .also {
                if (it.status != MapVersionStatus.draft) {
                    throw BadRequestException("Graph edits are only allowed on draft map versions")
                }
            }
}
