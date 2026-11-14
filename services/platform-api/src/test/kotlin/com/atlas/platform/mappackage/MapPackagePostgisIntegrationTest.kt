package com.atlas.platform.mappackage

import com.atlas.platform.domain.PoiStatus
import com.fasterxml.jackson.databind.JsonNode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName
import com.atlas.platform.repo.AuditLogRepository

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MapPackagePostgisIntegrationTest {
    @Autowired
    private lateinit var restTemplate: TestRestTemplate

    @Autowired
    private lateinit var auditLogRepository: AuditLogRepository

    @LocalServerPort
    private var port: Int = 0

    @Test
    fun `fresh PostGIS imports publishes searches and routes across two floors`() {
        val openApi = restTemplate.getForEntity(url("/v1/api-docs"), JsonNode::class.java)
        assertThat(openApi.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(openApi.headers.getFirst("X-Request-Id")).isNotBlank()
        assertThat(openApi.body!!["paths"].has("/v1/admin/map-packages/import")).isTrue()
        val unauthorized = restTemplate.getForEntity(url("/v1/admin/venues"), JsonNode::class.java)
        assertThat(unauthorized.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        val deniedReference = unauthorized.headers.getFirst("X-Request-Id")
        assertThat(deniedReference).isNotBlank()
        assertThat(unauthorized.body!!["requestId"].asText()).isEqualTo(deniedReference)

        val emptyVenue = restTemplate.exchange(
            url("/v1/admin/venues"),
            HttpMethod.POST,
            adminEntity(mapOf("slug" to "empty-invalid-venue", "name" to "Empty", "displayName" to "Empty")),
            JsonNode::class.java,
        ).body!!
        val emptyDraft = restTemplate.exchange(
            url("/v1/admin/venues/${emptyVenue["id"].asText()}/map-versions"),
            HttpMethod.POST,
            adminEntity(null),
            JsonNode::class.java,
        ).body!!
        val blockedPublication = restTemplate.exchange(
            url("/v1/admin/venues/${emptyVenue["id"].asText()}/map-versions/${emptyDraft["id"].asText()}/publish"),
            HttpMethod.POST,
            adminEntity(null),
            JsonNode::class.java,
        )
        assertThat(blockedPublication.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        val publicationReference = blockedPublication.headers.getFirst("X-Request-Id")
        assertThat(publicationReference).isNotBlank()
        assertThat(blockedPublication.body!!["requestId"].asText()).isEqualTo(publicationReference)

        val original = packageRequest("atlas-integration-mall", "map-v1")
        val imported = importPackage(original)
        assertThat(imported.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(imported.body?.created).isTrue()
        val first = imported.body!!

        val duplicate = importPackage(original)
        assertThat(duplicate.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(duplicate.body?.created).isFalse()
        assertThat(duplicate.body?.mapVersionId).isEqualTo(first.mapVersionId)

        val malformedVenueSlug = "atlas-invalid-mall"
        val malformed = packageRequest(malformedVenueSlug, "invalid-map").copy(
            // Source references are valid, but the persisted graph is disconnected.
            // This fails after writes have begun and proves the transaction rolls back.
            edges = original.edges.filterNot { it.id == "edge-level" }
        )
        val rejected = restTemplate.exchange(
            url("/v1/admin/map-packages/import"),
            HttpMethod.POST,
            adminEntity(malformed),
            JsonNode::class.java,
        )
        assertThat(rejected.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        val venuesAfterRejection = restTemplate.exchange(
            url("/v1/admin/venues"), HttpMethod.GET, adminEntity(null), JsonNode::class.java
        ).body!!
        assertThat(venuesAfterRejection.any { it["slug"].asText() == malformedVenueSlug }).isFalse()

        val published = restTemplate.exchange(
            url("/v1/admin/venues/${first.venueId}/map-versions/${first.mapVersionId}/publish"),
            HttpMethod.POST,
            adminEntity(null),
            JsonNode::class.java,
        )
        assertThat(published.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(published.body?.get("status")?.asText()).isEqualTo("published")
        assertThat(auditLogRepository.findAll().map { it.action })
            .contains("map_package.import", "map_version.validate", "map_version.publish")

        val search = restTemplate.getForEntity(
            url("/v1/venues/${first.venueId}/search?q=Zara"),
            JsonNode::class.java,
        )
        assertThat(search.statusCode).isEqualTo(HttpStatus.OK)
        val zara = search.body!!["results"].first()
        assertThat(zara["name"].asText()).isEqualTo("Zara")

        val routeRequest = mapOf(
            "mapVersionId" to first.mapVersionId,
            "start" to mapOf(
                "floorId" to first.mappings.floors.getValue("floor-ground"),
                "x" to 0.0,
                "y" to 0.0,
            ),
            "destinationPoiId" to zara["poiId"].asText(),
        )
        val route = restTemplate.postForEntity(
            url("/v1/venues/${first.venueId}/routes"),
            routeRequest,
            JsonNode::class.java,
        )
        assertThat(route.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(route.body!!["floors"].size()).isEqualTo(2)
        assertThat(route.body!!["transitions"].size()).isEqualTo(1)
        assertThat(route.body!!["distanceM"].asDouble()).isGreaterThan(0.0)
        val liftId = first.mappings.edges.getValue("edge-lift")
        val closureUrl = url("/v1/admin/closures/edges/$liftId")
        val closed = restTemplate.exchange(
            closureUrl, HttpMethod.POST, adminEntity(mapOf("closureState" to "closed")), JsonNode::class.java,
        )
        assertThat(closed.statusCode).isEqualTo(HttpStatus.OK)
        val closedPackage = restTemplate.getForEntity(url("/v1/venues/${first.venueId}/map-package"), JsonNode::class.java)
        val closedLift = closedPackage.body!!["graph"]["edges"].first { it["id"].asText() == liftId.toString() }
        assertThat(closedLift["closureState"].asText()).isEqualTo("closed")
        val routeWithClosure = restTemplate.postForEntity(
            url("/v1/venues/${first.venueId}/routes"), routeRequest, JsonNode::class.java,
        )
        assertThat(routeWithClosure.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        val reopened = restTemplate.exchange(
            closureUrl, HttpMethod.POST, adminEntity(mapOf("closureState" to "open")), JsonNode::class.java,
        )
        assertThat(reopened.statusCode).isEqualTo(HttpStatus.OK)

        val secondPackage = packageRequest("atlas-integration-mall", "map-v2").copy(
            pois = original.pois.map { if (it.name == "Zara") it.copy(keywords = it.keywords + "new-season") else it }
        )
        val second = importPackage(secondPackage).body!!
        assertThat(second.mapVersion).isEqualTo(2)
        val draftPackage = restTemplate.getForEntity(
            url("/v1/venues/${first.venueId}/map-package?mapVersionId=${second.mapVersionId}"),
            JsonNode::class.java,
        )
        assertThat(draftPackage.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        val mismatchedPackage = restTemplate.getForEntity(
            url("/v1/venues/${emptyVenue["id"].asText()}/map-package?mapVersionId=${first.mapVersionId}"),
            JsonNode::class.java,
        )
        assertThat(mismatchedPackage.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        val adminVersions = "/v1/admin/venues/${first.venueId}/map-versions"
        val validation = restTemplate.exchange(
            url("$adminVersions/${second.mapVersionId}/validation"),
            HttpMethod.GET,
            adminEntity(null),
            JsonNode::class.java,
        )
        assertThat(validation.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(validation.body!!["valid"].asBoolean()).isTrue()
        val rejectedRollback = restTemplate.exchange(
            url("$adminVersions/${second.mapVersionId}/rollback"),
            HttpMethod.POST,
            adminEntity(null),
            JsonNode::class.java,
        )
        assertThat(rejectedRollback.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val secondPublished = restTemplate.exchange(
            url("/v1/admin/venues/${second.venueId}/map-versions/${second.mapVersionId}/publish"),
            HttpMethod.POST,
            adminEntity(null),
            JsonNode::class.java,
        )
        assertThat(secondPublished.statusCode).isEqualTo(HttpStatus.OK)

        val venue = restTemplate.getForEntity(url("/v1/venues/${first.venueId}"), JsonNode::class.java).body!!
        assertThat(venue["publishedMapVersionId"].asText()).isEqualTo(second.mapVersionId.toString())
        val versions = restTemplate.exchange(url(adminVersions), HttpMethod.GET, adminEntity(null), JsonNode::class.java)
        assertThat(versions.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(versions.body!!.map { it["status"].asText() }).containsExactly("published", "retired")
        val rollback = restTemplate.exchange(
            url("$adminVersions/${first.mapVersionId}/rollback"),
            HttpMethod.POST,
            adminEntity(null),
            JsonNode::class.java,
        )
        assertThat(rollback.statusCode).isEqualTo(HttpStatus.OK)
        val restored = restTemplate.getForEntity(url("/v1/venues/${first.venueId}/map-package"), JsonNode::class.java)
        assertThat(restored.body!!["mapVersion"]["id"].asText()).isEqualTo(first.mapVersionId.toString())
    }

    private fun importPackage(request: MapPackageImportRequest) = restTemplate.exchange(
        url("/v1/admin/map-packages/import"),
        HttpMethod.POST,
        adminEntity(request),
        MapPackageImportResponse::class.java,
    )

    private fun adminEntity(body: Any?): HttpEntity<Any?> {
        val headers = HttpHeaders()
        headers.set("X-API-Key", "integration-key")
        return HttpEntity(body, headers)
    }

    private fun url(path: String) = "http://localhost:$port$path"

    private fun packageRequest(slug: String, mapSourceId: String): MapPackageImportRequest {
        val venueId = "venue-$slug"
        return MapPackageImportRequest(
            schemaVersion = 1,
            venue = VenueSource(venueId, slug, "Atlas Integration Mall"),
            mapVersion = MapVersionSource(mapSourceId, venueId, 1, "0.1.0"),
            floors = listOf(
                FloorSource("floor-ground", venueId, "Ground", 0, "G", sourceScale = 1.0),
                FloorSource("floor-level-one", venueId, "Level one", 1, "L1", sourceScale = 1.0),
            ),
            nodes = listOf(
                NodeSource("ground-start", "floor-ground", 0.0, 0.0, "entrance"),
                NodeSource("ground-lift", "floor-ground", 10.0, 0.0, "transition", "lift-a"),
                NodeSource("level-lift", "floor-level-one", 10.0, 0.0, "transition", "lift-a"),
                NodeSource("zara-door", "floor-level-one", 30.0, 0.0, "entrance"),
            ),
            edges = listOf(
                EdgeSource("edge-ground", "ground-start", "ground-lift", distanceM = 10.0),
                EdgeSource("edge-lift", "ground-lift", "level-lift", distanceM = 6.0, edgeType = "lift"),
                EdgeSource("edge-level", "level-lift", "zara-door", distanceM = 20.0),
            ),
            pois = listOf(
                PoiSource(
                    id = "poi-zara",
                    venueId = venueId,
                    floorId = "floor-level-one",
                    name = "Zara",
                    aliases = listOf("ZARA"),
                    keywords = listOf("fashion", "clothing"),
                    entranceNodeIds = listOf("zara-door"),
                    openingStatus = PoiStatus.open,
                )
            ),
        )
    }

    companion object {
        private val postgisImage = DockerImageName.parse("postgis/postgis:16-3.4")
            .asCompatibleSubstituteFor("postgres")

        @Container
        @JvmStatic
        val postgres = PostgreSQLContainer(postgisImage)
            .withDatabaseName("atlas_integration")
            .withUsername("atlas")
            .withPassword("atlas")

        @DynamicPropertySource
        @JvmStatic
        fun databaseProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("spring.jpa.hibernate.ddl-auto") { "validate" }
            registry.add("atlas.security.admin-api-keys") { "integration-key:PLATFORM_ADMIN,MAPPING_OPERATOR" }
        }
    }
}
