package com.atlas.platform.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

@Entity
@Table(name = "venues")
class Venue(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(nullable = false, unique = true)
    var slug: String,

    @Column(nullable = false)
    var name: String,

    @Column(name = "display_name", nullable = false)
    var displayName: String,

    var category: String? = null,

    var description: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "default_locale", nullable = false)
    var defaultLocale: String = "en",

    @Column(name = "content_languages", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    var contentLanguages: String = "[]",

    @Column(name = "published_map_version_id")
    var publishedMapVersionId: UUID? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime = OffsetDateTime.now(),
)
