package com.atlas.platform.errors

import com.atlas.platform.security.SecurityConfig
import jakarta.servlet.FilterChain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.slf4j.MDC
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import java.util.UUID

class RequestIdFilterTest {
    private val filter = RequestIdFilter()

    @Test
    fun `retains a valid id through response and error handling`() {
        val request = MockHttpServletRequest("GET", "/v1/venues")
        request.addHeader("X-Request-Id", "atlas_test-123")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response) { _, _ ->
            val error = GlobalExceptionHandler().handleResponseStatus(NotFoundException("Missing"), request)
            assertThat(error.body?.requestId).isEqualTo("atlas_test-123")
            assertThat(MDC.get("requestId")).isEqualTo("atlas_test-123")
        }

        assertThat(response.getHeader("X-Request-Id")).isEqualTo("atlas_test-123")
        assertThat(MDC.get("requestId")).isNull()
    }

    @Test
    fun `replaces invalid input and includes the new id in admin authentication errors`() {
        val request = MockHttpServletRequest("GET", "/v1/admin/venues")
        request.addHeader("X-Request-Id", "unsafe id with spaces")
        val response = MockHttpServletResponse()
        val auth = SecurityConfig.ApiKeyAuthFilter(emptyMap())

        filter.doFilter(request, response) { req, res ->
            auth.doFilter(req, res, FilterChain { _, _ -> error("Expected an authentication error") })
        }

        val id = response.getHeader("X-Request-Id")!!
        assertThat(UUID.fromString(id).toString()).isEqualTo(id)
        assertThat(response.status).isEqualTo(401)
        assertThat(response.contentAsString).contains(""""requestId":"$id"""")
    }
}
