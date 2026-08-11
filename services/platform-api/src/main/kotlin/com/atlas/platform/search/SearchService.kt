package com.atlas.platform.search

import com.atlas.platform.domain.PointOfInterest
import com.atlas.platform.domain.PoiStatus
import com.atlas.platform.repo.PointOfInterestRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import java.util.UUID

// Initial organic ranking (techspec.md §11): text relevance, exact alias/name
// match boosting, availability filtering. Distance and popularity factors are
// inputs to add when position sampling and analytics exist.
@Service
class SearchService(
    private val poiRepository: PointOfInterestRepository,
) {

    private val mapper = jacksonObjectMapper()

    data class SearchHit(
        val poiId: UUID,
        val name: String,
        val floorId: UUID,
        val category: UUID?,
        val sponsored: Boolean = false,
        val score: Double,
    )

    fun search(
        venueId: UUID,
        mapVersionId: UUID,
        query: String,
        floorId: UUID?,
        category: String?,
    ): List<SearchHit> {
        val normalizedQuery = query.trim().lowercase()
        if (normalizedQuery.isEmpty()) return emptyList()

        val candidates = poiRepository.findByMapVersionId(mapVersionId)
            .asSequence()
            .filter { it.venueId == venueId }
            .filter { floorId == null || it.floorId == floorId }
            .filter { it.status != PoiStatus.closed }
            .toList()

        return candidates
            .mapNotNull { poi -> scorePoi(poi, normalizedQuery, category)?.let { poi to it } }
            .sortedWith(compareByDescending<Pair<PointOfInterest, Double>> { it.second }.thenBy { it.first.name })
            .map { (poi, score) ->
                SearchHit(
                    poiId = poi.id,
                    name = poi.name,
                    floorId = poi.floorId,
                    category = poi.categoryId,
                    score = score,
                )
            }
    }

    private fun scorePoi(poi: PointOfInterest, query: String, category: String?): Double? {
        val name = poi.name.lowercase()
        val aliases: List<String> = runCatching { mapper.readValue<List<String>>(poi.aliases) }.getOrDefault(emptyList())
        val keywords: List<String> = runCatching { mapper.readValue<List<String>>(poi.searchKeywords) }.getOrDefault(emptyList())

        var score = 0.0

        // Exact name/alias match (highest weight per techspec.md §11 ranking input 2).
        if (name == query) score += 100.0
        else if (aliases.any { it.lowercase() == query }) score += 90.0

        // Prefix/substring text relevance (ranking input 1).
        if (name.startsWith(query)) score += 50.0
        else if (name.contains(query)) score += 25.0
        if (aliases.any { it.lowercase().startsWith(query) }) score += 30.0
        if (keywords.any { it.lowercase().startsWith(query) }) score += 20.0

        // Category intent match (§11: product/category intent).
        if (category != null && poi.subcategory?.equals(category, ignoreCase = true) == true) score += 15.0

        // Availability: temporarily closed destinations rank below open ones
        // (§11 ranking input 3) but are not hidden.
        if (poi.status == PoiStatus.temporarily_closed) score -= 10.0

        return if (score > 0.0) score else null
    }
}
