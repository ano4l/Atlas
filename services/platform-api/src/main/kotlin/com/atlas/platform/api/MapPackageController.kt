package com.atlas.platform.api

import com.atlas.platform.mappackage.MapPackageService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Map packages", description = "Versioned, internally consistent venue packages (techspec.md §9.3)")
@RestController
@RequestMapping("/v1/venues/{venueId}")
class MapPackageController(
    private val mapPackageService: MapPackageService,
) {

    @Operation(summary = "Fetch a venue map package")
    @GetMapping("/map-package")
    fun getMapPackage(
        @PathVariable venueId: UUID,
        @RequestParam(required = false) mapVersionId: UUID?,
    ): Map<String, Any?> = mapPackageService.buildPackage(venueId, mapVersionId)
}
