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
