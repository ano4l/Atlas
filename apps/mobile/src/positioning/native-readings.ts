import type { SensorReading } from "@atlas/positioning-core";

const STANDARD_GRAVITY = 9.80665;
type VectorReading = { x: number; y: number; z: number; timestamp: number };

function nativeTimestamp(timestamp: number) {
  return Number.isFinite(timestamp) && timestamp >= 0 ? timestamp : undefined;
}

export function readAcceleration(sample: VectorReading): SensorReading | null {
  const { x, y, z, timestamp } = sample;
  if (![x, y, z].every(Number.isFinite)) return null;
  return {
    kind: "motion",
    accelerationX: x * STANDARD_GRAVITY,
    accelerationY: y * STANDARD_GRAVITY,
    accelerationZ: z * STANDARD_GRAVITY,
    sensorTimestampSeconds: nativeTimestamp(timestamp),
  };
}

export function readDeviceMotion(sample: {
  accelerationIncludingGravity?: VectorReading | null;
  acceleration?: VectorReading | null;
}): SensorReading | null {
  const total = sample.accelerationIncludingGravity;
  if (!total || ![total.x, total.y, total.z].every(Number.isFinite)) return null;
  const reading: Extract<SensorReading, { kind: "motion" }> = {
    kind: "motion",
    accelerationX: total.x,
    accelerationY: total.y,
    accelerationZ: total.z,
    sensorTimestampSeconds: nativeTimestamp(total.timestamp),
  };
  const linear = sample.acceleration;
  if (!linear || ![linear.x, linear.y, linear.z, linear.timestamp, total.timestamp].every(Number.isFinite) ||
      linear.timestamp < 0 || total.timestamp < 0 || Math.abs(linear.timestamp - total.timestamp) > 0.08) return reading;
  const gx = total.x - linear.x;
  const gy = total.y - linear.y;
  const gz = total.z - linear.z;
  const gravity = Math.hypot(gx, gy, gz);
  if (gravity >= 7 && gravity <= 13) {
    const vertical = -(linear.x * (gx / gravity) + linear.y * (gy / gravity) + linear.z * (gz / gravity));
    if (Number.isFinite(vertical)) reading.verticalAccelerationMps2 = vertical;
  }
  return reading;
}

export function readPressure(sample: { pressure: number; timestamp: number }): SensorReading | null {
  if (!Number.isFinite(sample.pressure) || sample.pressure < 100 || sample.pressure > 1500) return null;
  return {
    kind: "pressure",
    hectopascals: sample.pressure,
    sensorTimestampSeconds: nativeTimestamp(sample.timestamp),
  };
}
