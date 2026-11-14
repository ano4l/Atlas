package com.atlas.platform.routing

import com.atlas.platform.domain.NavigationEdge
import com.atlas.platform.domain.NavigationNode
import com.atlas.platform.repo.MapVersionRepository
import com.atlas.platform.repo.NavigationEdgeRepository
import com.atlas.platform.repo.NavigationNodeRepository
import com.atlas.platform.repo.PointOfInterestRepository
import com.atlas.platform.repo.VenueRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import java.util.UUID

class RouteServiceTest {
    private val service = RouteService(
        mock(VenueRepository::class.java),
        mock(MapVersionRepository::class.java),
        mock(NavigationNodeRepository::class.java),
        mock(NavigationEdgeRepository::class.java),
        mock(PointOfInterestRepository::class.java),
    )

    private val mapVersionId = UUID.randomUUID()
    private val floorId = UUID.randomUUID()

    @Test
    fun `corridor points follow travel direction and anchor to nodes`() {
        val start = node(0.0, 0.0)
        val end = node(5.0, 0.0)
        val authored = """{"type":"LineString","coordinates":[[0.5,0],[1,2],[4,2],[5,0]]}"""
        val expected = listOf(listOf(0.0, 0.0), listOf(1.0, 2.0), listOf(4.0, 2.0), listOf(5.0, 0.0))
        assertEquals(expected, edgePoints(authored, start, end))
        assertEquals(expected.reversed(), edgePoints(authored, end, start))
        for (geometry in listOf(null, "{", "[[0,0],[1,2],[99,0]]", """[[0,0],["1",2],[5,0]]""")) {
            assertEquals(listOf(expected.first(), expected.last()), edgePoints(geometry, start, end))
        }
    }

    @Test
    fun `step free edges require evidence and exclude stairs and escalators`() {
        val start = node(0.0, 0.0)
        val end = node(2.0, 0.0)
        val routeEdge = edge(start, end, 2.0)
        assertEquals(false, routeEdge.isStepFree())
        routeEdge.accessibilityMetadata = """{"stepFree":"true"}"""
        assertEquals(false, routeEdge.isStepFree())
        routeEdge.accessibilityMetadata = """{"stepFree":true}"""
        routeEdge.edgeType = "lift"
        assertEquals(true, routeEdge.isStepFree())
        routeEdge.edgeType = "escalator"
        assertEquals(false, routeEdge.isStepFree())
    }

    @Test
    fun `route costs can be lower than coordinate distance`() {
        val start = node(0.0, 0.0)
        val detour = node(100.0, 0.0)
        val goal = node(1.0, 0.0)
        val nodes = listOf(start, detour, goal)
        val edges = listOf(edge(start, goal, 5.0), edge(start, detour, 1.0), edge(detour, goal, 1.0))

        assertEquals(listOf(start.id, detour.id, goal.id), service.aStar(nodes, edges, start.id, goal.id))
    }

    @Test
    fun `a star chooses the lower cost path`() {
        val start = node(0.0, 0.0)
        val expensive = node(1.0, 0.0)
        val cheap = node(0.0, 1.0)
        val goal = node(2.0, 0.0)
        val edges = listOf(
            edge(start, expensive, 10.0),
            edge(expensive, goal, 10.0),
            edge(start, cheap, 1.0),
            edge(cheap, goal, 2.0),
        )

        val path = service.aStar(listOf(start, expensive, cheap, goal), edges, start.id, goal.id)

        assertEquals(listOf(start.id, cheap.id, goal.id), path)
    }

    @Test
    fun `a star respects one way edges`() {
        val start = node(0.0, 0.0)
        val goal = node(1.0, 0.0)
        val oneWay = edge(start, goal, 1.0, oneWay = true)

        assertEquals(listOf(start.id, goal.id), service.aStar(listOf(start, goal), listOf(oneWay), start.id, goal.id))
        assertNull(service.aStar(listOf(start, goal), listOf(oneWay), goal.id, start.id))
    }

    private fun node(x: Double, y: Double) = NavigationNode(
        mapVersionId = mapVersionId,
        floorId = floorId,
        x = x,
        y = y,
    )

    private fun edge(from: NavigationNode, to: NavigationNode, cost: Double, oneWay: Boolean = false) =
        NavigationEdge(
            mapVersionId = mapVersionId,
            fromNodeId = from.id,
            toNodeId = to.id,
            baseCostM = cost,
            oneWay = oneWay,
        )
}
