package com.atlas.platform.api

import com.atlas.platform.routing.RouteRequest
import com.atlas.platform.routing.RouteService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Routes", description = "Route calculation (techspec.md §7.4, §10.2-10.3)")
@RestController
@RequestMapping("/v1/venues/{venueId}/routes")
class RouteController(
    private val routeService: RouteService,
) {

    @Operation(summary = "Calculate a route to a destination POI")
    @PostMapping
    fun calculateRoute(
        @PathVariable venueId: UUID,
        @Valid @RequestBody request: RouteRequest,
    ) = routeService.calculateRoute(venueId, request)
}
