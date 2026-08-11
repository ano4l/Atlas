package com.atlas.platform.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.filter.OncePerRequestFilter

// Interim admin authentication: static API keys with roles, configured via
// the ADMIN_API_KEYS env var ("key:ROLE1,ROLE2;key2:ROLE1"). This is a
// placeholder until the identity-provider decision (techspec.md §20) lands —
// all admin authorization checks already use role names so the swap to JWT
// is configuration-level, not code-level.

@ConfigurationProperties(prefix = "atlas.security")
data class AdminSecurityProperties(
    var adminApiKeys: String = "",
)

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(AdminSecurityProperties::class)
class SecurityConfig(
    private val properties: AdminSecurityProperties,
) {

    private val logger = LoggerFactory.getLogger(SecurityConfig::class.java)

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        val keys = parseApiKeys(properties.adminApiKeys)
        if (keys.size == 1 && keys.containsKey("changeme")) {
            logger.warn("Using the default admin API key — set ADMIN_API_KEYS before any non-local deployment")
        }

        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/v1/admin/**").authenticated()
                    .anyRequest().permitAll()
            }
            .addFilterBefore(ApiKeyAuthFilter(keys), UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    private fun parseApiKeys(raw: String): Map<String, List<String>> =
        raw.split(";")
            .mapNotNull { entry ->
                val parts = entry.trim().split(":", limit = 2)
                if (parts.size != 2 || parts[0].isBlank()) return@mapNotNull null
                parts[0] to parts[1].split(",").map { it.trim() }.filter { it.isNotEmpty() }
            }
            .toMap()

    class ApiKeyAuthFilter(
        private val keys: Map<String, List<String>>,
    ) : OncePerRequestFilter() {

        override fun doFilterInternal(
            request: HttpServletRequest,
            response: HttpServletResponse,
            filterChain: FilterChain,
        ) {
            if (!request.requestURI.startsWith("/v1/admin")) {
                filterChain.doFilter(request, response)
                return
            }

            val apiKey = request.getHeader("X-API-Key")
            val roles = apiKey?.let { keys[it] }

            if (roles == null) {
                response.status = HttpStatus.UNAUTHORIZED.value()
                response.contentType = "application/json"
                response.writer.write("""{"code":"UNAUTHORIZED","message":"Valid X-API-Key header required for admin endpoints"}""")
                return
            }

            val auth = UsernamePasswordAuthenticationToken(
                apiKey.take(8) + "…",
                null,
                roles.map { SimpleGrantedAuthority("ROLE_$it") },
            )
            SecurityContextHolder.getContext().authentication = auth
            filterChain.doFilter(request, response)
        }

        override fun shouldNotFilter(request: HttpServletRequest): Boolean =
            !request.requestURI.startsWith("/v1/admin")
    }
}
