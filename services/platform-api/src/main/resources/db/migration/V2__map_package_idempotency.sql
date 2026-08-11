CREATE UNIQUE INDEX uq_map_versions_source_checksum
    ON map_versions (imported_source_checksum)
    WHERE imported_source_checksum IS NOT NULL;
