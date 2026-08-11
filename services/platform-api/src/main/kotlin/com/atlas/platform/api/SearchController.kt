package com.atlas.platform.api

import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.VenueRepository
import com.atlas.platform.search.SearchService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Search", description = "Venue POI search and ranking (techspec.md §11)")
@RestController
@RequestMapping("/v1/venues/{venueId}")
class SearchController(
    private val searchService: SearchService,
    private val venueRepository: VenueRepository,
) {

    @Operation(summary = "Search POIs within a venue")
    @GetMapping("/search")
    fun search(
        @PathVariable venueId: UUID,
        @RequestParam q: String,
        @RequestParam(required = false) floorId: UUID?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) mapVersionId: UUID?,
    ): Map<String, Any?> {
        val venue = venueRepository.findById(venueId)
            .orElseThrow { NotFoundException("Venue not found") }
        val versionId = mapVersionId ?: venue.publishedMapVersionId
            ?: throw NotFoundException("Venue has no published map version")
        val results = searchService.search(venueId, versionId, q, floorId, category)
        return mapOf(
            "query" to q,
            "results" to results,
        )
    }
}
