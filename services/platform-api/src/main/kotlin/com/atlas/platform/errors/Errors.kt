package com.atlas.platform.errors

import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.validation.BindException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException

// Standard error contract (techspec.md §10): code, message, details, requestId.
data class ApiError(
    val code: String,
    val message: String,
    val details: Map<String, Any?>? = null,
    val requestId: String,
)

class NotFoundException(message: String) : ResponseStatusException(HttpStatus.NOT_FOUND, message)
class ConflictException(message: String) : ResponseStatusException(HttpStatus.CONFLICT, message)
class BadRequestException(message: String) : ResponseStatusException(HttpStatus.BAD_REQUEST, message)

@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(ex: ResponseStatusException, request: HttpServletRequest): ResponseEntity<ApiError> {
        val status = HttpStatus.valueOf(ex.statusCode.value())
        val body = ApiError(
            code = status.name,
            message = ex.reason ?: status.reasonPhrase,
            requestId = requestId(request),
        )
        return ResponseEntity.status(status).body(body)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class, BindException::class)
    fun handleValidation(ex: BindException, request: HttpServletRequest): ResponseEntity<ApiError> {
        val details = ex.bindingResult.fieldErrors.associate { it.field to it.defaultMessage }
        val body = ApiError(
            code = "VALIDATION_FAILED",
            message = "Request validation failed",
            details = details,
            requestId = requestId(request),
        )
        return ResponseEntity.badRequest().body(body)
    }

    @ExceptionHandler(HttpMessageNotReadableException::class, MissingServletRequestParameterException::class)
    fun handleBadRequest(ex: Exception, request: HttpServletRequest): ResponseEntity<ApiError> {
        val body = ApiError(
            code = "BAD_REQUEST",
            message = if (ex is MissingServletRequestParameterException) {
                "Missing request parameter: ${ex.parameterName}"
            } else {
                "Malformed request body"
            },
            requestId = requestId(request),
        )
        return ResponseEntity.badRequest().body(body)
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(ex: Exception, request: HttpServletRequest): ResponseEntity<ApiError> {
        val requestId = requestId(request)
        logger.error("Unhandled exception requestId=$requestId", ex)
        val body = ApiError(
            code = "INTERNAL_ERROR",
            message = "An unexpected error occurred",
            requestId = requestId,
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body)
    }
}
