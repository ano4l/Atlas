package com.atlas.platform.routing

import com.atlas.platform.domain.NavigationNode
import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import kotlin.math.hypot

private val geometryMapper = ObjectMapper().enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)

internal fun edgePoints(geometry: String?, from: NavigationNode, to: NavigationNode): List<List<Double>> {
    val start = listOf(from.x, from.y)
    val end = listOf(to.x, to.y)
    val straight = listOf(start, end)
    if (geometry == null) return straight
    val decoded = try {
        geometryMapper.readTree(geometry)
    } catch (_: JsonProcessingException) {
        return straight
    }
    val coordinates = if (decoded?.path("type")?.asText() == "LineString") decoded.path("coordinates") else decoded
    if (coordinates == null || !coordinates.isArray || coordinates.size() < 3) return straight
    val points = coordinates.map { point ->
        if (!point.isArray || point.size() != 2 || point.any { !it.isNumber || !it.asDouble().isFinite() }) {
            return straight
        }
        listOf(point[0].asDouble(), point[1].asDouble())
    }

    // Allow the same one-metre endpoint tolerance as the map authoring validator.
    fun mismatch(first: List<Double>, last: List<Double>): Double {
        val fromError = hypot(first[0] - from.x, first[1] - from.y)
        val toError = hypot(last[0] - to.x, last[1] - to.y)
        return if (fromError <= 1 && toError <= 1) fromError + toError else Double.POSITIVE_INFINITY
    }
    val forward = mismatch(points.first(), points.last())
    val reverse = mismatch(points.last(), points.first())
    if (forward.isInfinite() && reverse.isInfinite()) return straight
    val interior = points.subList(1, points.lastIndex)
    return listOf(start) + (if (reverse < forward) interior.asReversed() else interior) + listOf(end)
}
