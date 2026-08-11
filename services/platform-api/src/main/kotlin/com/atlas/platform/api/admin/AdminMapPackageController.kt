package com.atlas.platform.api.admin

import com.atlas.platform.mappackage.MapPackageImportRequest
import com.atlas.platform.mappackage.MapPackageImportResponse
import com.atlas.platform.mappackage.MapPackageImportService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Admin — map packages", description = "Transactional versioned map-package ingestion")
@RestController
@RequestMapping("/v1/admin/map-packages")
class AdminMapPackageController(
    private val importService: MapPackageImportService,
) {
    @Operation(
        summary = "Import a complete map package into a draft map version",
        responses = [
            ApiResponse(responseCode = "201", description = "Package imported"),
            ApiResponse(responseCode = "200", description = "Identical package already imported"),
            ApiResponse(responseCode = "400", description = "Package validation failed"),
        ],
    )
    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','MAPPING_OPERATOR')")
    fun importPackage(
        @Valid @RequestBody request: MapPackageImportRequest,
        @AuthenticationPrincipal actor: String?,
    ): ResponseEntity<MapPackageImportResponse> {
        val response = importService.importPackage(request, actor)
        return ResponseEntity.status(if (response.created) HttpStatus.CREATED else HttpStatus.OK).body(response)
    }
}
