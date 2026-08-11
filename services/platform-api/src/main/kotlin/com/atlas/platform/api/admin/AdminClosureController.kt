package com.atlas.platform.api.admin

import com.atlas.platform.domain.ClosureState
import com.atlas.platform.domain.NavigationEdge
import com.atlas.platform.errors.NotFoundException
import com.atlas.platform.repo.AuditLogRepository
import com.atlas.platform.repo.NavigationEdgeRepository
import com.atlas.platform.domain.AuditLogEntry
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.OffsetDateTime
import java.util.UUID

@Tag(name = "Admin — closures", description = "Temporary closures and restricted edges (techspec.md §9.2, §9.3)")
@RestController
@RequestMapping("/v1/admin/closures")
class AdminClosureController(
    private val edgeRepository: NavigationEdgeRepository,
    private val auditLogRepository: AuditLogRepository,
) {

    private val mapper = jacksonObjectMapper()

    data class ClosureRequest(
        @field:NotNull val closureState: ClosureState,
        val validFrom: OffsetDateTime? = null,
        val validUntil: OffsetDateTime? = null,
        val reason: String? = null,
    )

    @Operation(summary = "Open, close, or temporarily close an edge (urgent-closure path)")
    @PostMapping("/edges/{edgeId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR','VENUE_ADMIN')")
    fun setEdgeClosure(
        @PathVariable edgeId: UUID,
        @Valid @RequestBody request: ClosureRequest,
        @AuthenticationPrincipal actor: String?,
    ): NavigationEdge {
        val edge = edgeRepository.findById(edgeId)
            .orElseThrow { NotFoundException("Edge not found") }
        edge.closureState = request.closureState
        edge.validFrom = request.validFrom
        edge.validUntil = request.validUntil
        val saved = edgeRepository.save(edge)

        auditLogRepository.save(
            AuditLogEntry(
                actor = actor ?: "unknown",
                action = "closure.${request.closureState.name}",
                entityType = "navigation_edge",
                entityId = edgeId.toString(),
                details = mapper.writeValueAsString(mapOf("reason" to request.reason)),
            )
        )
        return saved
    }
}
