package com.atlas.platform.mappackage

import com.atlas.platform.domain.PoiStatus
import com.atlas.platform.repo.FloorRepository
import com.atlas.platform.repo.NavigationEdgeRepository
import com.atlas.platform.repo.NavigationNodeRepository
import com.atlas.platform.repo.PointOfInterestRepository
import com.atlas.platform.routing.RouteService
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class MapPackageValidationServiceTest {
    private val service = MapPackageValidationService(
        mockk<FloorRepository>(relaxed = true),
        mockk<NavigationNodeRepository>(relaxed = true),
        mockk<NavigationEdgeRepository>(relaxed = true),
        mockk<PointOfInterestRepository>(relaxed = true),
        mockk<RouteService>(relaxed = true),
    )

    @Test
    fun `source validation rejects duplicate and unknown references`() {
        val request = validRequest().copy(
            floors = listOf(
                FloorSource("floor", "venue", "Ground", 0),
                FloorSource("floor", "venue", "Duplicate", 1),
            ),
            nodes = listOf(NodeSource("node", "missing-floor", 0.0, 0.0)),
        )

        val codes = service.validateSource(request).issues.map { it.code }

        assertThat(codes).contains("DUPLICATE_SOURCE_ID", "UNKNOWN_FLOOR", "UNKNOWN_NODE")
    }

    @Test
    fun `source validation rejects cross venue and illegal floor transition references`() {
        val request = validRequest().copy(
            mapVersion = MapVersionSource("map", "other-venue", 1),
            floors = listOf(
                FloorSource("floor", "venue", "Ground", 0),
                FloorSource("floor-two", "venue", "Level one", 1),
            ),
            nodes = listOf(
                NodeSource("node", "floor", 0.0, 0.0),
                NodeSource("node-two", "floor-two", 1.0, 1.0),
            ),
            edges = listOf(EdgeSource("edge", "node", "node-two", distanceM = 2.0, edgeType = "corridor")),
            pois = listOf(PoiSource("poi", "other-venue", "floor", "Shop", entranceNodeIds = listOf("node"))),
        )

        val codes = service.validateSource(request).issues.map { it.code }

        assertThat(codes).contains("CROSS_VENUE_REFERENCE", "INVALID_FLOOR_TRANSITION")
    }

    private fun validRequest() = MapPackageImportRequest(
        schemaVersion = 1,
        venue = VenueSource("venue", "venue", "Venue"),
        mapVersion = MapVersionSource("map", "venue", 1),
        floors = listOf(FloorSource("floor", "venue", "Ground", 0)),
        nodes = listOf(NodeSource("node", "floor", 0.0, 0.0)),
        edges = listOf(EdgeSource("edge", "node", "node-two", distanceM = 1.0)),
        pois = listOf(PoiSource("poi", "venue", "floor", "Shop", openingStatus = PoiStatus.open, entranceNodeIds = listOf("node"))),
    )
}
