package com.atlas.platform.routing

import com.atlas.platform.domain.NavigationEdge
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

private val accessibilityMapper = jacksonObjectMapper()

/** Older packages without accessibility evidence are unavailable in step-free mode. */
internal fun NavigationEdge.isStepFree(): Boolean {
    if (edgeType.lowercase() in setOf("stairs", "escalator")) return false
    val declared = runCatching { accessibilityMapper.readTree(accessibilityMetadata)?.get("stepFree") }.getOrNull()
    return declared?.isBoolean == true && declared.booleanValue()
}
