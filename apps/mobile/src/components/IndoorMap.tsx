import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Theme } from "../theme";
import { MapCanvas } from "./MapCanvas";
import { atlasSandtonVenue } from "../fixtures";
import { MapPoint } from "../map/types";

type Props = {
  theme: Theme;
  progress?: number; // 0 to 1 route progress
  confidence?: "high" | "medium" | "low";
  floorLevel?: number; // 1 (Ground) or 2 (Level 1)
  closure?: boolean;
  moving?: boolean;
  pickMode?: boolean;
  onPick?: () => void;
  selected?: boolean;
  recenterKey?: number;
  routeVisible?: boolean;
  routeReveal?: number;
  reducedMotion?: boolean;
};

// Calculate interpolated (x, y) point along a polyline given a progress ratio [0, 1]
function pointAlong(polyline: MapPoint[], progress: number): MapPoint {
  if (!polyline || polyline.length < 2) return polyline[0] ?? { x: 190, y: 438 };
  const lengths = polyline
    .slice(1)
    .map((point, index) =>
      Math.hypot(point.x - polyline[index].x, point.y - polyline[index].y),
    );
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let remaining = Math.max(0, Math.min(1, progress)) * total;

  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index]) {
      const ratio = lengths[index] ? remaining / lengths[index] : 0;
      return {
        x:
          polyline[index].x +
          (polyline[index + 1].x - polyline[index].x) * ratio,
        y:
          polyline[index].y +
          (polyline[index + 1].y - polyline[index].y) * ratio,
      };
    }
    remaining -= lengths[index];
  }
  return polyline[polyline.length - 1];
}

export function IndoorMap({
  theme,
  floorLevel = 1,
  progress = 0.1,
  confidence = "high",
  closure,
  moving,
  pickMode,
  onPick,
  selected,
  recenterKey = 0,
  routeVisible = false,
  routeReveal = 1,
  reducedMotion: reducedMotionPreference = false,
}: Props) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const reducedMotion = reducedMotionPreference || systemReducedMotion;

  const floor =
    atlasSandtonVenue.floors.find((item) => item.level === floorLevel) ??
    atlasSandtonVenue.floors[0];

  const routeSegment = routeVisible ? atlasSandtonVenue.route.find(
    (item) => item.floorId === floor.id,
  ) : undefined;

  // Map progress to current floor
  const localProgress =
    floorLevel === 1
      ? Math.min(1, progress / 0.55)
      : Math.max(0, (progress - 0.45) / 0.55);

  const position = useMemo(
    () =>
      pointAlong(
        routeSegment?.polyline ?? [atlasSandtonVenue.start],
        localProgress,
      ),
    [routeSegment, localProgress],
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemReducedMotion,
    );
    return () => subscription.remove();
  }, []);

  // Recenter map on recenterKey change
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
    }).start();
  }, [recenterKey, pan, scale]);

  // Subtle zoom bounce when navigating floor transition
  useEffect(() => {
    Animated.timing(scale, {
      toValue: moving ? 0.94 : 1,
      duration: reducedMotion ? 0 : 380,
      useNativeDriver: true,
    }).start();
  }, [moving, reducedMotion, scale]);

  // PanResponder for smooth dragging/panning
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !pickMode,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !pickMode && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
      onPanResponderGrant: () =>
        pan.setOffset({
          x: (pan.x as unknown as { _value: number })._value,
          y: (pan.y as unknown as { _value: number })._value,
        }),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => pan.flattenOffset(),
    }),
  ).current;

  return (
    <Pressable
      onPress={pickMode ? onPick : undefined}
      accessibilityRole={pickMode ? "button" : undefined}
      accessibilityLabel={
        pickMode
          ? "Map correction mode. Tap to place your location on the map"
          : routeVisible
            ? `Indoor map of Sandton City, ${floor.name}. Route preview visible.`
            : `Indoor map of Sandton City, ${floor.name}. No destination selected.`
      }
      style={[styles.mapContainer, { backgroundColor: theme.mapBg }]}
    >
      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.canvasWrapper,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale },
            ],
          },
        ]}
      >
        <MapCanvas
          floor={floor}
          route={routeSegment}
          theme={theme}
          position={position}
          confidence={confidence}
          showClosure={closure}
          selected={selected}
          progressAnimated={reducedMotion ? 1 : routeReveal}
          destinationPoint={routeVisible ? atlasSandtonVenue.destination.point : undefined}
          showRouteMarkers={routeVisible}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  canvasWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
