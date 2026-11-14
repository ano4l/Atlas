import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withTiming,
} from "react-native-reanimated";
import { Theme } from "../theme";
import { atlasSandtonVenue, samplePOIs } from "../fixtures";
import { IndoorMapData, MapPoint, POIItem } from "../map/types";
import { CameraMode, cameraPoints } from "../map/camera";
import { DemoRoute } from "../map/demo-routing";
import {
  clamp,
  fitCamera,
  hitTestPlace,
  MapCamera,
  mapExtent,
  MAX_ZOOM,
  MIN_ZOOM,
  panLimits,
  zoomAt,
} from "../map/viewport";
import { hitsStoreLabel, MapCanvas } from "./MapCanvas";
import { GlassSurface } from "./GlassSurface";

type Props = {
  theme: Theme;
  venue?: Pick<IndoorMapData, "venueName" | "floors" | "start">;
  places?: POIItem[];
  floorLevel: number;
  recenterKey: number;
  route: Pick<DemoRoute, "segments"> | null;
  destination: POIItem | null;
  position: MapPoint;
  positionFloor: number;
  reducedMotion: boolean;
  onSelectPOI: (poi: POIItem) => void;
  hasSheet: boolean;
  cameraMode: CameraMode;
  onPan: () => void;
  sheetHeight: number;
  liveSheetHeight?: SharedValue<number>;
  topInset: number;
  nextPoint?: MapPoint;
  navigating?: boolean;
  arrived?: boolean;
};

export function IndoorMap({
  theme,
  venue = atlasSandtonVenue,
  places = samplePOIs,
  floorLevel,
  recenterKey,
  route,
  destination,
  position,
  positionFloor,
  reducedMotion,
  onSelectPOI,
  cameraMode,
  onPan,
  sheetHeight,
  liveSheetHeight,
  topInset,
  nextPoint,
  navigating = false,
  arrived = false,
}: Props) {
  const { fontScale } = useWindowDimensions();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [showUnitLabels, setShowUnitLabels] = useState(false);
  const floor = venue.floors.find((f) => f.level === floorLevel)!;
  const segments = useMemo(
    () => route?.segments.filter((segment) => segment.floorLevel === floorLevel) ?? [],
    [route, floorLevel],
  );
  const routePoints = useMemo(() => segments.flatMap((segment) => segment.polyline), [segments]);
  const scale = useSharedValue(0.5),
    x = useSharedValue(0),
    y = useSharedValue(0);
  const panX = useSharedValue(0),
    panY = useSharedValue(0),
    pinchScale = useSharedValue(1);
  const focalX = useSharedValue(0),
    focalY = useSharedValue(0),
    panning = useSharedValue(false),
    pinching = useSharedValue(false);
  const rebasePan = useSharedValue(false);
  const positionX = useSharedValue(position.x),
    positionY = useSharedValue(position.y);
  const bottomInset = sheetHeight + 20;
  const viewport = useMemo(
    () => ({ ...size, top: topInset, bottom: bottomInset }),
    [size, topInset, bottomInset],
  );
  const lastFrame = useRef<{
    mode: CameraMode;
    viewport: typeof viewport;
    recenterKey: number;
    floorLevel: number;
    scale: number;
    navigating: boolean;
  } | null>(null);
  const extent = useMemo(
    () => mapExtent(floor.overviewPoints ?? floor.plate),
    [floor],
  );
  const overview = useMemo(
    () => [
      ...floor.plate,
      ...(floor.contextLabels ?? []).map((label) => label.point),
    ],
    [floor],
  );
  const focusPosition =
    cameraMode === "follow" ? position : venue.start;
  const focusNext = cameraMode === "follow" ? nextPoint : undefined;
  // Separate the reveal and hide thresholds so labels stay stable near the boundary.
  useAnimatedReaction(
    () => (scale.value >= 1.06 ? 1 : scale.value <= 0.94 ? -1 : 0),
    (band, previous) => {
      if (band && band !== previous) runOnJS(setShowUnitLabels)(band > 0);
    },
  );
  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    setSize((previous) =>
      width === previous.width && height === previous.height
        ? previous
        : { width, height },
    );
  }, []);
  const callbacks = useRef({
    onPan,
    onSelectPOI,
    floor,
    places,
    destinationId: destination?.id,
  });
  callbacks.current = {
    onPan,
    onSelectPOI,
    floor,
    places,
    destinationId: destination?.id,
  };
  const markManual = useCallback(() => callbacks.current.onPan(), []);
  const selectAt = useCallback(
    (mapX: number, mapY: number, zoomScale: number) => {
      const { floor, places, destinationId } = callbacks.current;
      const point = { x: mapX, y: mapY };
      const labelledRoom = floor.rooms.find(
        (room) =>
          room.id !== destinationId &&
          hitsStoreLabel(room, point, zoomScale, fontScale),
      );
      const labelledPlace = labelledRoom
        ? places.find((place) => place.id === labelledRoom.id)
        : undefined;
      const poi =
        labelledPlace ?? hitTestPlace(point, floor, places, zoomScale);
      if (poi) callbacks.current.onSelectPOI(poi);
    },
    [fontScale],
  );

  useEffect(() => {
    positionX.value = withTiming(position.x, {
      duration: reducedMotion ? 0 : navigating ? 500 : 340,
      easing: Easing.linear,
    });
    positionY.value = withTiming(position.y, {
      duration: reducedMotion ? 0 : navigating ? 500 : 340,
      easing: Easing.linear,
    });
  }, [
    position.x,
    position.y,
    positionFloor,
    positionX,
    positionY,
    reducedMotion,
    navigating,
  ]);
  useEffect(() => {
    if (!viewport.width) return;
    const previous = lastFrame.current;
    if (cameraMode === "manual") {
      if (previous) previous.mode = "manual";
      return;
    }
    let focus = cameraPoints(
      cameraMode,
      overview,
      routePoints,
      focusPosition,
      focusNext,
    );
    if (cameraMode === "route" && destination?.floorLevel === floorLevel) {
      const room = floor.rooms.find((r) => r.id === destination.id);
      if (room) focus = [...focus, ...room.points];
    }
    const camera = fitCamera(focus, {
      ...viewport,
      right: cameraMode === "floor" ? 24 : 68,
    });
    const tracking =
      navigating &&
      cameraMode === "follow" &&
      previous?.mode === "follow" &&
      previous.navigating &&
      previous.viewport === viewport &&
      previous.recenterKey === recenterKey &&
      previous.floorLevel === floorLevel;
    const duration = reducedMotion || !previous ? 0 : tracking ? 500 : 420;
    lastFrame.current = {
      mode: cameraMode,
      viewport,
      recenterKey,
      floorLevel,
      scale: camera.scale,
      navigating,
    };
    // Retarget the existing timing on the UI thread and keep zoom stable during each walk tick.
    runOnUI(
      (
        target: MapCamera,
        durationMs: number,
        linear: boolean,
        updateScale: boolean,
      ) => {
        "worklet";
        if (panning.value || pinching.value) return;
        const config = {
          duration: durationMs,
          easing: linear ? Easing.linear : Easing.inOut(Easing.cubic),
        };
        x.value = withTiming(target.x, config);
        y.value = withTiming(target.y, config);
        if (updateScale) scale.value = withTiming(target.scale, config);
      },
    )(
      camera,
      duration,
      tracking,
      reducedMotion ||
        !tracking ||
        Math.abs(previous.scale - camera.scale) > 0.0001,
    );
  }, [
    viewport,
    cameraMode,
    floor,
    overview,
    routePoints,
    recenterKey,
    destination?.id,
    focusPosition.x,
    focusPosition.y,
    focusNext?.x,
    focusNext?.y,
    reducedMotion,
    floorLevel,
    navigating,
    panning,
    pinching,
    x,
    y,
    scale,
  ]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .maxPointers(1)
      .minDistance(6)
      .onStart(() => {
        panning.value = true;
        if (pinching.value) {
          rebasePan.value = true;
          return;
        }
        cancelAnimation(x);
        cancelAnimation(y);
        cancelAnimation(scale);
        panX.value = x.value;
        panY.value = y.value;
        rebasePan.value = false;
        runOnJS(markManual)();
      })
      .onUpdate((e) => {
        if (pinching.value) return;
        if (rebasePan.value) {
          panX.value = x.value - e.translationX;
          panY.value = y.value - e.translationY;
          rebasePan.value = false;
        }
        const limits = panLimits(viewport, extent, scale.value);
        x.value = clamp(panX.value + e.translationX, limits.minX, limits.maxX);
        y.value = clamp(panY.value + e.translationY, limits.minY, limits.maxY);
      })
      .onEnd((e, success) => {
        if (!success || pinching.value || rebasePan.value || reducedMotion)
          return;
        const limits = panLimits(viewport, extent, scale.value);
        x.value = withDecay({
          velocity: e.velocityX,
          deceleration: 0.994,
          clamp: [limits.minX, limits.maxX],
        });
        y.value = withDecay({
          velocity: e.velocityY,
          deceleration: 0.994,
          clamp: [limits.minY, limits.maxY],
        });
      })
      .onFinalize(() => {
        panning.value = false;
      });
    const pinch = Gesture.Pinch()
      .onStart((e) => {
        pinching.value = true;
        rebasePan.value = true;
        cancelAnimation(x);
        cancelAnimation(y);
        cancelAnimation(scale);
        pinchScale.value = scale.value;
        focalX.value = (e.focalX - x.value) / scale.value;
        focalY.value = (e.focalY - y.value) / scale.value;
        runOnJS(markManual)();
      })
      .onUpdate((e) => {
        const next = clamp(pinchScale.value * e.scale, MIN_ZOOM, MAX_ZOOM);
        const limits = panLimits(viewport, extent, next);
        scale.value = next;
        x.value = clamp(
          e.focalX - focalX.value * next,
          limits.minX,
          limits.maxX,
        );
        y.value = clamp(
          e.focalY - focalY.value * next,
          limits.minY,
          limits.maxY,
        );
      })
      .onFinalize(() => {
        pinching.value = false;
      });
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(240)
      .onEnd((e, success) => {
        if (!success) return;
        if (scale.value >= MAX_ZOOM) return;
        cancelAnimation(x);
        cancelAnimation(y);
        cancelAnimation(scale);
        const camera = zoomAt(
          { x: x.value, y: y.value, scale: scale.value },
          { x: e.x, y: e.y },
          scale.value * 1.65,
        );
        const config = { duration: reducedMotion ? 0 : 220 };
        const limits = panLimits(viewport, extent, camera.scale);
        x.value = withTiming(clamp(camera.x, limits.minX, limits.maxX), config);
        y.value = withTiming(clamp(camera.y, limits.minY, limits.maxY), config);
        scale.value = withTiming(camera.scale, config);
        runOnJS(markManual)();
      });
    const tap = Gesture.Tap()
      .maxDistance(8)
      .onEnd((e, success) => {
        if (!success) return;
        const zoomScale = scale.value;
        runOnJS(selectAt)(
          (e.x - x.value) / zoomScale,
          (e.y - y.value) / zoomScale,
          zoomScale,
        );
      });
    return Gesture.Simultaneous(pan, pinch, Gesture.Exclusive(doubleTap, tap));
  }, [
    viewport,
    extent,
    reducedMotion,
    markManual,
    selectAt,
    x,
    y,
    scale,
    panX,
    panY,
    panning,
    pinching,
    rebasePan,
    pinchScale,
    focalX,
    focalY,
  ]);

  const worldStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));
  const toolsPosition = useAnimatedStyle(() => ({
    transform: [{ translateY: -(liveSheetHeight?.value ?? sheetHeight) - 12 }],
  }));
  const zoom = (factor: number) => {
    markManual();
    cancelAnimation(x);
    cancelAnimation(y);
    cancelAnimation(scale);
    const camera = zoomAt(
      { x: x.value, y: y.value, scale: scale.value },
      {
        x: size.width / 2,
        y: topInset + Math.max(100, size.height - topInset - bottomInset) / 2,
      },
      scale.value * factor,
    );
    const config = { duration: reducedMotion ? 0 : 220 };
    const limits = panLimits(viewport, extent, camera.scale);
    x.value = withTiming(clamp(camera.x, limits.minX, limits.maxX), config);
    y.value = withTiming(clamp(camera.y, limits.minY, limits.maxY), config);
    scale.value = withTiming(camera.scale, config);
  };
  return (
    <View
      style={[styles.container, { backgroundColor: theme.mapBg }]}
      onLayout={onLayout}
    >
      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          collapsable={false}
          accessible
          accessibilityActions={[
            { name: "increment", label: "Zoom in" },
            { name: "decrement", label: "Zoom out" },
          ]}
          onAccessibilityAction={(event) =>
            zoom(event.nativeEvent.actionName === "increment" ? 1.4 : 1 / 1.4)
          }
          accessibilityLabel={`${venue.venueName}. ${floor.name}. ${floor.walkways ? "Fictional venue map." : "Reference schematic. Entrances are unconfirmed."} Pinch to zoom, drag to explore, or use the zoom buttons.`}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.world,
              { width: floor.bounds.width, height: floor.bounds.height },
              worldStyle,
            ]}
          >
            <MapCanvas
              floor={floor}
              routes={segments}
              places={places}
              theme={theme}
              destination={destination}
              scale={scale}
              positionX={positionX}
              positionY={positionY}
              showPosition={!arrived && positionFloor === floorLevel}
              position={position}
              nextPoint={nextPoint}
              navigating={navigating}
              reducedMotion={reducedMotion}
              arrived={arrived}
              fontScale={fontScale}
              showUnitLabels={showUnitLabels}
            />
          </Animated.View>
        </View>
      </GestureDetector>
      {cameraMode === "manual" && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.bottomTools, toolsPosition]}
        >
          <MapScale scale={scale} theme={theme} />
          <GlassSurface theme={theme} style={styles.zoom}>
            {([true, false] as const).map((zoomIn) => (
              <Pressable
                key={String(zoomIn)}
                onPress={() => zoom(zoomIn ? 1.4 : 1 / 1.4)}
                accessibilityRole="button"
                accessibilityLabel={
                  zoomIn ? "Zoom in on indoor map" : "Zoom out on indoor map"
                }
                style={({ pressed }) => [
                  styles.zoomButton,
                  pressed && { backgroundColor: theme.accentSoft },
                ]}
              >
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  accessible={false}
                >
                  <Path
                    d={zoomIn ? "M4 10h12 M10 4v12" : "M4 10h12"}
                    fill="none"
                    stroke={theme.ink}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>
            ))}
            <View
              pointerEvents="none"
              style={[styles.zoomDivider, { backgroundColor: theme.line }]}
            />
          </GlassSurface>
        </Animated.View>
      )}
    </View>
  );
}

function MapScale({
  scale,
  theme,
}: {
  scale: SharedValue<number>;
  theme: Theme;
}) {
  const [label, setLabel] = useState(50);
  const metres = useDerivedValue(() => {
    const zoom = scale.value;
    if (zoom >= 1.9) return 10;
    if (zoom >= 0.85) return 20;
    if (zoom >= 0.385) return 50;
    return zoom >= 0.19 ? 100 : 200;
  });
  useAnimatedReaction(
    () => metres.value,
    (value, previous) => {
      if (value !== previous) runOnJS(setLabel)(value);
    },
  );
  // The schematic fixture uses an illustrative scale of two map units to a metre.
  const bar = useAnimatedStyle(() => ({
    width: 2 * metres.value * scale.value,
  }));
  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel={`Approximate map scale, ${label} metres`}
      style={[styles.scaleCard, { backgroundColor: theme.paperTranslucent }]}
    >
      <Text style={[styles.scaleText, { color: theme.muted }]}>≈{label} m</Text>
      <Animated.View
        style={[styles.scaleBar, { borderColor: theme.muted }, bar]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  world: { position: "absolute", left: 0, top: 0, transformOrigin: [0, 0, 0] },
  bottomTools: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  scaleCard: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    gap: 2,
    alignItems: "center",
  },
  scaleText: { fontSize: 10, fontWeight: "600", fontVariant: ["tabular-nums"] },
  scaleBar: { height: 4, borderWidth: 1, borderTopWidth: 0 },
  zoom: { borderRadius: 22, marginBottom: 56 },
  zoomDivider: {
    position: "absolute",
    top: 44,
    left: 9,
    right: 9,
    height: StyleSheet.hairlineWidth,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
