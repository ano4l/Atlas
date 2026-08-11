package com.atlas.platform.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "beacons")
class Beacon(
    @Id
    var id: UUID = UUID.randomUUID(),

    @Column(name = "map_version_id", nullable = false)
    var mapVersionId: UUID,

    @Column(name = "floor_id", nullable = false)
    var floorId: UUID,

    @Column(name = "beacon_uuid", nullable = false)
    var beaconUuid: String,

    var major: Int? = null,

    var minor: Int? = null,

    @Column(nullable = false)
    var x: Double,

    @Column(nullable = false)
    var y: Double,

    @Column(name = "reference_rssi_at_1m", nullable = false)
    var referenceRssiAt1m: Int = -59,

    @Column(name = "path_loss_exponent", nullable = false)
    var pathLossExponent: Double = 2.0,

    @Column(name = "battery_status")
    var batteryStatus: String? = null,

    @Column(name = "last_observed_at")
    var lastObservedAt: OffsetDateTime? = null,

    @Column(nullable = false)
    var active: Boolean = true,
)
