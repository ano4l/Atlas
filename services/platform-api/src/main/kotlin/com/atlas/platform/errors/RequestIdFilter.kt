package com.atlas.platform.errors

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

private const val REQUEST_ID_HEADER = "X-Request-Id"
private const val REQUEST_ID_ATTRIBUTE = "atlas.requestId"
private val validRequestId = Regex("[A-Za-z0-9_-]{1,64}")

internal fun requestId(request: HttpServletRequest): String =
    request.getAttribute(REQUEST_ID_ATTRIBUTE) as? String ?: UUID.randomUUID().toString().also {
        request.setAttribute(REQUEST_ID_ATTRIBUTE, it)
    }

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestIdFilter : OncePerRequestFilter() {
    private val requestLogger = LoggerFactory.getLogger(RequestIdFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val provided = request.getHeader(REQUEST_ID_HEADER)?.takeIf(validRequestId::matches)
        if (provided != null) request.setAttribute(REQUEST_ID_ATTRIBUTE, provided)
        val id = requestId(request)
        response.setHeader(REQUEST_ID_HEADER, id)
        val previousId = MDC.get("requestId")
        MDC.put("requestId", id)
        try {
            filterChain.doFilter(request, response)
            if (response.status >= 400 && request.requestURI.startsWith("/v1/")) {
                requestLogger.info("API request failed method={} status={}", request.method, response.status)
            }
        } finally {
            if (previousId == null) MDC.remove("requestId") else MDC.put("requestId", previousId)
        }
    }
}
