-- Initial schema for the spatial platform (techspec.md §7.3, §8).
-- Local rendering coordinates are stored as plain doubles; geographic
-- anchor/bounds use PostGIS geometry in EPSG:4326.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    category VARCHAR(120),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    bounds geometry(Polygon, 4326),
    default_locale VARCHAR(16) NOT NULL DEFAULT 'en',
    content_languages JSONB NOT NULL DEFAULT '[]',
    published_map_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE map_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues (id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'validated', 'published', 'retired')),
    imported_source_checksum VARCHAR(128),
    created_by VARCHAR(255),
    published_at TIMESTAMPTZ,
    minimum_app_version VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (venue_id, version)
);

ALTER TABLE venues
    ADD CONSTRAINT fk_published_map_version
    FOREIGN KEY (published_map_version_id) REFERENCES map_versions (id);

CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_version_id UUID NOT NULL REFERENCES map_versions (id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ordinal INTEGER NOT NULL,
    public_label VARCHAR(64),
    -- Rendering vertices in local metres; canonical storage only, never
    -- treated as the canonical format upstream (techspec.md §7.1).
    local_bounds JSONB,
    source_scale DOUBLE PRECISION
);

CREATE TABLE poi_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues (id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    parent_id UUID REFERENCES poi_categories (id),
    UNIQUE (venue_id, name)
);

CREATE TABLE navigation_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_version_id UUID NOT NULL REFERENCES map_versions (id) ON DELETE CASCADE,
    floor_id UUID NOT NULL REFERENCES floors (id) ON DELETE CASCADE,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    node_type VARCHAR(40) NOT NULL DEFAULT 'corridor',
    transition_group_id UUID,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_nodes_map_version ON navigation_nodes (map_version_id);
CREATE INDEX idx_nodes_floor ON navigation_nodes (floor_id);

CREATE TABLE navigation_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_version_id UUID NOT NULL REFERENCES map_versions (id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES navigation_nodes (id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES navigation_nodes (id) ON DELETE CASCADE,
    edge_type VARCHAR(40) NOT NULL DEFAULT 'walkway',
    directionality VARCHAR(20) NOT NULL DEFAULT 'bidirectional'
        CHECK (directionality IN ('bidirectional', 'one_way')),
    base_cost_m DOUBLE PRECISION NOT NULL,
    is_one_way BOOLEAN NOT NULL DEFAULT FALSE,
    is_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    closure_state VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (closure_state IN ('open', 'closed', 'temporary_closed')),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    accessibility_metadata JSONB NOT NULL DEFAULT '{}',
    -- Local-metre polyline for rendering: [[x,y], ...]
    geometry JSONB
);

CREATE INDEX idx_edges_map_version ON navigation_edges (map_version_id);
CREATE INDEX idx_edges_from_node ON navigation_edges (from_node_id);
CREATE INDEX idx_edges_to_node ON navigation_edges (to_node_id);

CREATE TABLE points_of_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_version_id UUID NOT NULL REFERENCES map_versions (id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues (id) ON DELETE CASCADE,
    floor_id UUID NOT NULL REFERENCES floors (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    aliases JSONB NOT NULL DEFAULT '[]',
    category_id UUID REFERENCES poi_categories (id),
    subcategory VARCHAR(120),
    visual_anchor_x DOUBLE PRECISION,
    visual_anchor_y DOUBLE PRECISION,
    entry_point_node_id UUID REFERENCES navigation_nodes (id),
    search_keywords JSONB NOT NULL DEFAULT '[]',
    opening_hours JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'temporarily_closed', 'closed')),
    accessibility_notes TEXT
);

CREATE INDEX idx_pois_map_version ON points_of_interest (map_version_id);
CREATE INDEX idx_pois_floor ON points_of_interest (floor_id);
-- Trigram-free baseline: plain lower() index for prefix search; the search
-- service ranks name/alias/keyword matches in application code (§11).
CREATE INDEX idx_pois_lower_name ON points_of_interest (lower(name));

CREATE TABLE beacons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_version_id UUID NOT NULL REFERENCES map_versions (id) ON DELETE CASCADE,
    floor_id UUID NOT NULL REFERENCES floors (id) ON DELETE CASCADE,
    beacon_uuid VARCHAR(64) NOT NULL,
    major INTEGER,
    minor INTEGER,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    reference_rssi_at_1m INTEGER NOT NULL DEFAULT -59,
    path_loss_exponent DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    battery_status VARCHAR(20),
    last_observed_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_beacons_map_version ON beacons (map_version_id);

-- Raw event inbox. event_id is the idempotency key supplied by the client
-- (techspec.md §8.2). Status distinguishes accepted vs. quarantined rows.
CREATE TABLE events_raw (
    event_id UUID PRIMARY KEY,
    event_name VARCHAR(120) NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    occurred_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_id VARCHAR(120),
    installation_id VARCHAR(120),
    venue_id UUID,
    map_version_id UUID,
    app_version VARCHAR(32),
    platform VARCHAR(16),
    analytics_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    personalised_ads_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(16) NOT NULL DEFAULT 'accepted'
        CHECK (status IN ('accepted', 'quarantined')),
    rejection_reason TEXT
);

CREATE INDEX idx_events_name_received ON events_raw (event_name, received_at);
CREATE INDEX idx_events_venue_received ON events_raw (venue_id, received_at);

-- Audit log (techspec.md §13.6): map publication, closures, campaign
-- changes, exports, role changes.
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(120),
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
