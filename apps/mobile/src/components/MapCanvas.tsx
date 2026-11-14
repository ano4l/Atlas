import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { fonts, Theme } from "../theme";
import {
  IndoorFloor,
  MapFacilityKind,
  MapLabel,
  MapPoint,
  MapRoom,
  POIItem,
  RouteFloorSegment,
} from "../map/types";
import {
  LabelBox,
  MapPalette,
  mapPalette,
  pathLength,
  placeKind,
  placeLabels,
  progressAlong,
  roundedPath,
  splitPath,
} from "../map/style";
import { storeNameLines } from "../map/viewport";
import { placeGlyph } from "../place-presentation";
import { Icon, IconName } from "./Icon";

const points = (items: MapPoint[]) =>
  items.map((p) => `${p.x},${p.y}`).join(" ");

const BADGE = 24;
const LINE = 15;
const LABEL_GAP = 3;
const labelLines = (room: MapRoom) =>
  room.demo && room.name.includes(" ")
    ? [
        room.name.slice(0, room.name.lastIndexOf(" ")),
        room.name.slice(room.name.lastIndexOf(" ") + 1),
      ]
    : storeNameLines(room.name);
const labelHeight = (lines: number) => BADGE + LABEL_GAP + lines * LINE;

/** True when a tap lands on a store's badge or name, in map coordinates. */
export function hitsStoreLabel(
  room: MapRoom,
  point: MapPoint,
  scale: number,
  fontScale: number,
) {
  if (!room.label || room.labelMode === "detail" || (room.demo && scale < 0.85))
    return false;
  const lines = labelLines(room);
  const height = labelHeight(lines.length);
  const x = (point.x - room.label.x) * scale;
  const y = (point.y - room.label.y) * scale;
  const badgeY = -height / 2 + BADGE / 2;
  if (Math.hypot(x, y - badgeY) <= BADGE / 2 + 4) return true;
  const size = 12.5 * Math.min(fontScale, 1.3);
  const widest = Math.max(...lines.map((line) => line.length));
  return (
    y >= badgeY + BADGE / 2 &&
    y <= height / 2 + 3 &&
    Math.abs(x) <= widest * size * 0.29 + 4
  );
}

/**
 * Static geometry. Nothing in here animates, so the platform draws it once
 * and afterwards only moves the finished layer when the camera changes.
 */
const MapBase = memo(function MapBase({
  floor,
  palette,
  places,
  showUnitLabels,
}: {
  floor: IndoorFloor;
  palette: MapPalette;
  places: POIItem[];
  showUnitLabels: boolean;
}) {
  const refs = useMemo(
    () => new Map(places.map((place) => [place.id, place.unitLabel])),
    [places],
  );
  return (
    <Svg
      width={floor.bounds.width}
      height={floor.bounds.height}
      viewBox={`0 0 ${floor.bounds.width} ${floor.bounds.height}`}
      style={StyleSheet.absoluteFill}
      accessible={false}
    >
      {floor.siteBoundary && (
        <Polygon points={points(floor.siteBoundary)} fill={palette.grounds} />
      )}
      {floor.contextRoad && (
        <>
          <Path
            d={floor.contextRoad}
            stroke={palette.roadCasing}
            strokeWidth={53}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={floor.contextRoad}
            stroke={palette.roadFill}
            strokeWidth={49}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {/* Two offset copies read as a soft shadow under the building. */}
      <Polygon
        points={points(floor.plate)}
        transform="translate(0 9)"
        fill={palette.plateShadow}
        opacity={0.05}
      />
      <Polygon
        points={points(floor.plate)}
        transform="translate(0 3)"
        fill={palette.plateShadow}
        opacity={0.07}
      />
      <Polygon
        points={points(floor.plate)}
        fill={palette.plate}
        stroke={palette.plateEdge}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {floor.walkways?.map((path, index) => (
        <Polyline
          key={index}
          points={points(path)}
          fill="none"
          stroke={palette.court}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {floor.courts?.map((court, index) => (
        <G key={index}>
          <Circle
            cx={court.point.x}
            cy={court.point.y}
            r={court.radius}
            fill={palette.court}
            stroke={palette.plateEdge}
            strokeWidth={1.2}
          />
          {/* Illustrative planting stays clear of the gallery through the court. */}
          {[
            [-28, 6],
            [18, -27],
            [28, 18],
          ].map(([dx, dy], plant) => (
            <G key={plant}>
              <Circle
                cx={court.point.x + dx}
                cy={court.point.y + dy}
                r={10}
                fill={palette.plant}
                stroke={palette.plantEdge}
                strokeWidth={1}
              />
              <Circle
                cx={court.point.x + dx - 2.5}
                cy={court.point.y + dy - 2.5}
                r={5}
                fill={palette.plantLight}
              />
            </G>
          ))}
          {[-1, 1].map((side) => (
            <Rect
              key={side}
              x={court.point.x + side * 27 - 6}
              y={court.point.y - 16}
              width={12}
              height={4}
              rx={2}
              fill={palette.bench}
            />
          ))}
        </G>
      ))}
      {/* A shaded lower edge under every unit gives the floor shallow depth. */}
      {floor.rooms.map((room) => (
        <Polygon
          key={`lip-${room.id}`}
          points={points(room.points)}
          transform="translate(0 2.4)"
          fill={palette.tones[placeKind(room.category)].lip}
        />
      ))}
      {/* The walkway-coloured outline leaves a clean gap between neighbours. */}
      {floor.rooms.map((room) => (
        <Polygon
          key={room.id}
          points={points(room.points)}
          fill={palette.tones[placeKind(room.category)].fill}
          stroke={palette.plate}
          strokeWidth={1.7}
          strokeLinejoin="round"
        />
      ))}
      {floor.rooms.map((room) =>
        room.entrance ? (
          <Line
            key={`door-${room.id}`}
            x1={room.entrance.from.x}
            y1={room.entrance.from.y}
            x2={room.entrance.to.x}
            y2={room.entrance.to.y}
            stroke={palette.plate}
            strokeWidth={5}
            strokeLinecap="round"
          />
        ) : null,
      )}
      {showUnitLabels &&
        floor.rooms.map((room) => {
          if (room.labelMode !== "detail" || !room.label) return null;
          const text = refs.get(room.id) || room.name;
          const xs = room.points.map((point) => point.x);
          const ys = room.points.map((point) => point.y);
          const width =
            Math.min(
              Math.max(...xs) - room.label.x,
              room.label.x - Math.min(...xs),
            ) *
              2 -
            6;
          const height =
            Math.min(
              Math.max(...ys) - room.label.y,
              room.label.y - Math.min(...ys),
            ) *
              2 -
            6;
          const size = Math.min(width / (text.length * 0.6), height / 1.2, 7.5);
          if (size < 4) return null;
          return (
            <SvgText
              key={`ref-${room.id}`}
              x={room.label.x}
              y={room.label.y + size * 0.35}
              fontSize={size}
              fontWeight="600"
              textAnchor="middle"
              fill={palette.tones.unknown.ink}
            >
              {text}
            </SvgText>
          );
        })}
      {floor.walkways &&
        places
          .filter((place) => place.floorLevel === floor.level)
          .map((place) => (
            <Circle
              key={place.id}
              cx={place.point.x}
              cy={place.point.y}
              r={2.4}
              fill={palette.route}
              stroke={palette.plate}
              strokeWidth={0.9}
            />
          ))}
    </Svg>
  );
});

type RouteMode = "preview" | "active" | "complete";

/**
 * The route and the selected unit. It is sized to their bounding box and only
 * redraws on discrete events: a walk tick, a selection or a zoom step.
 */
const MapRouteLayer = memo(function MapRouteLayer({
  routes,
  room,
  palette,
  zoom,
  mode,
  position,
}: {
  routes: RouteFloorSegment[];
  room?: MapRoom;
  palette: MapPalette;
  zoom: number;
  mode: RouteMode;
  position?: MapPoint;
}) {
  const paths = routes
    .map((route) => route.polyline)
    .filter((path) => path.length > 1);
  const all = [...paths.flat(), ...(room?.points ?? [])];
  if (!all.length) return null;
  const unit = 1 / zoom;
  const pad = 16 * unit + 4;
  const minX = Math.min(...all.map((p) => p.x)) - pad;
  const minY = Math.min(...all.map((p) => p.y)) - pad;
  const width = Math.max(...all.map((p) => p.x)) + pad - minX;
  const height = Math.max(...all.map((p) => p.y)) + pad - minY;
  const corner = 9 * unit;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`${minX} ${minY} ${width} ${height}`}
      style={{ position: "absolute", left: minX, top: minY }}
      accessible={false}
    >
      {room && (
        <Polygon
          points={points(room.points)}
          fill={palette.selectedFill}
          stroke={palette.selectedStroke}
          strokeWidth={2.6 * unit}
          strokeLinejoin="round"
        />
      )}
      {paths.map((path, index) => {
        if (mode === "preview") {
          const d = roundedPath(path, corner);
          const dash = [0.01, 11 * unit];
          return (
            <G key={index}>
              <Path
                d={d}
                fill="none"
                stroke={palette.routeHalo}
                strokeWidth={9.5 * unit}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
              <Path
                d={d}
                fill="none"
                stroke={palette.route}
                strokeWidth={6 * unit}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
            </G>
          );
        }
        const total = pathLength(path);
        const done =
          mode === "complete"
            ? total
            : position
              ? progressAlong(path, position)
              : 0;
        const { before, after } = splitPath(path, done);
        const travelled = before.length > 1 ? roundedPath(before, corner) : "";
        const ahead =
          mode === "active" && after.length > 1
            ? roundedPath(after, corner)
            : "";
        // Chevrons sit at fixed distances so they do not crawl with the walker.
        const spacing = 78 * unit;
        const chevrons: { point: MapPoint; angle: number }[] = [];
        if (ahead) {
          let offset = 0;
          let next = spacing / 2;
          for (let i = 1; i < path.length; i++) {
            const a = path[i - 1];
            const b = path[i];
            const length = Math.hypot(b.x - a.x, b.y - a.y);
            while (next <= offset + length) {
              const fraction = (next - offset) / length;
              const clear =
                next - offset > 12 * unit && offset + length - next > 12 * unit;
              if (clear && next > done + 16 * unit)
                chevrons.push({
                  point: {
                    x: a.x + (b.x - a.x) * fraction,
                    y: a.y + (b.y - a.y) * fraction,
                  },
                  angle: Math.atan2(b.y - a.y, b.x - a.x),
                });
              next += spacing;
            }
            offset += length;
          }
        }
        const size = 2.6 * unit;
        return (
          <G
            key={index}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {!!travelled && (
              <>
                <Path
                  d={travelled}
                  stroke={palette.routeHalo}
                  strokeWidth={10 * unit}
                />
                <Path
                  d={travelled}
                  stroke={palette.routeTravelled}
                  strokeWidth={6 * unit}
                />
              </>
            )}
            {!!ahead && (
              <>
                <Path
                  d={ahead}
                  stroke={palette.routeHalo}
                  strokeWidth={12.5 * unit}
                />
                <Path
                  d={ahead}
                  stroke={palette.routeCasing}
                  strokeWidth={9.5 * unit}
                />
                <Path
                  d={ahead}
                  stroke={palette.route}
                  strokeWidth={6.5 * unit}
                />
              </>
            )}
            {chevrons.map(({ point, angle }, chevron) => {
              const dx = Math.cos(angle) * size;
              const dy = Math.sin(angle) * size;
              return (
                <Path
                  key={chevron}
                  d={`M${point.x - dx - dy},${point.y - dy + dx} L${point.x + dx},${point.y + dy} L${point.x - dx + dy},${point.y - dy - dx}`}
                  stroke={palette.routeArrow}
                  strokeWidth={1.7 * unit}
                />
              );
            })}
          </G>
        );
      })}
    </Svg>
  );
});

/** Keeps a view at a constant screen size while the map around it zooms. */
function useCounterScale(
  scale: SharedValue<number>,
  visibleFrom = 0,
  rotation = 0,
) {
  return useAnimatedStyle(() => ({
    opacity: scale.value >= visibleFrom ? 1 : 0,
    transform: [{ scale: 1 / scale.value }, { rotate: `${rotation}deg` }],
  }));
}

const ANCHOR_W = 176;
const ANCHOR_H = 112;
const anchor = (point: MapPoint) => ({
  left: point.x - ANCHOR_W / 2,
  top: point.y - ANCHOR_H / 2,
});

const PlaceLabel = memo(function PlaceLabel({
  room,
  palette,
  scale,
  full,
}: {
  room: MapRoom;
  palette: MapPalette;
  scale: SharedValue<number>;
  full: boolean;
}) {
  const style = useCounterScale(scale);
  const tone = palette.tones[placeKind(room.category)];
  if (!room.label) return null;
  if (!full)
    return (
      <Animated.View style={[styles.anchor, anchor(room.label), style]}>
        <View
          style={[
            styles.dot,
            { backgroundColor: tone.badge, borderColor: palette.halo },
          ]}
        />
      </Animated.View>
    );
  return (
    <Animated.View style={[styles.anchor, anchor(room.label), style]}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: tone.badge,
            borderColor: palette.halo,
            shadowColor: palette.plateShadow,
          },
        ]}
      >
        <Icon
          name={placeGlyph(room.category ?? "")}
          color="#FFFFFF"
          size={14}
          strokeWidth={2.2}
        />
      </View>
      {labelLines(room).map((line) => (
        <Text
          key={line}
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={[
            styles.placeText,
            {
              color: tone.ink,
              textShadowColor: palette.halo,
            },
          ]}
        >
          {line}
        </Text>
      ))}
    </Animated.View>
  );
});

const facilityIcon: Record<MapFacilityKind, IconName> = {
  lift: "lift",
  escalator: "escalator",
  restroom: "restroom",
  information: "info",
  parking: "parking",
  accessibility: "accessibility",
};

function FacilityLabel({
  point,
  kind,
  palette,
  scale,
}: {
  point: MapPoint;
  kind: MapFacilityKind;
  palette: MapPalette;
  scale: SharedValue<number>;
}) {
  const style = useCounterScale(scale, 0.55);
  return (
    <Animated.View style={[styles.anchor, anchor(point), style]}>
      <View
        style={[
          styles.facility,
          { backgroundColor: palette.plate, borderColor: palette.plateEdge },
        ]}
      >
        <Icon name={facilityIcon[kind]} color={palette.label} size={15} />
      </View>
    </Animated.View>
  );
}

function TextLabel({
  label,
  palette,
  scale,
  variant,
}: {
  label: MapLabel;
  palette: MapPalette;
  scale: SharedValue<number>;
  variant: "road" | "area";
}) {
  const style = useCounterScale(
    scale,
    variant === "area" ? 0.8 : 0,
    label.rotate ?? 0,
  );
  return (
    <Animated.View style={[styles.anchor, anchor(label.point), style]}>
      <Text
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        style={
          variant === "road"
            ? [styles.roadText, { color: palette.roadText }]
            : [styles.areaText, { color: palette.areaText }]
        }
      >
        {variant === "area" ? label.text.toUpperCase() : label.text}
      </Text>
    </Animated.View>
  );
}

const PUCK = 104;

/** The walker. It moves by transform only, so the map is never redrawn. */
const Puck = memo(function Puck({
  x,
  y,
  scale,
  palette,
  heading,
  directional,
  navigating,
  reducedMotion,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  palette: MapPalette;
  heading?: number;
  directional: boolean;
  navigating: boolean;
  reducedMotion: boolean;
}) {
  const bearing = useSharedValue(heading ?? 0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (heading === undefined) return;
    // Turn through the shorter arc.
    const delta = heading - bearing.value;
    const turn = Math.atan2(Math.sin(delta), Math.cos(delta));
    bearing.value = withTiming(bearing.value + turn, {
      duration: reducedMotion ? 0 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [bearing, heading, reducedMotion]);
  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withDelay(
        500,
        withTiming(1, { duration: 1900, easing: Easing.out(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse, reducedMotion]);
  const frame = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - PUCK / 2 },
      { translateY: y.value - PUCK / 2 },
      { scale: 1 / scale.value },
    ],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - pulse.value),
    transform: [{ scale: 0.55 + pulse.value * 0.75 }],
  }));
  const arrow = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bearing.value + Math.PI / 2}rad` }],
  }));
  return (
    <Animated.View style={[styles.puckFrame, frame]}>
      <Animated.View
        style={[styles.puckPulse, { backgroundColor: palette.puck }, ring]}
      />
      <View style={[styles.puckHalo, { backgroundColor: palette.puck }]} />
      {directional ? (
        <View
          style={[
            styles.puckDisc,
            styles.puckDiscLarge,
            {
              backgroundColor: palette.puckRing,
              shadowColor: palette.plateShadow,
            },
          ]}
        >
          <Animated.View style={arrow}>
            <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
              <Path
                d="M12 2.5L20 20.5L12 16.2L4 20.5Z"
                fill={palette.puck}
                stroke={palette.puck}
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>
      ) : (
        <View
          style={[
            styles.puckDisc,
            {
              backgroundColor: palette.puckRing,
              shadowColor: palette.plateShadow,
            },
          ]}
        >
          <View style={[styles.puckCore, { backgroundColor: palette.puck }]} />
        </View>
      )}
      {!navigating && (
        <View
          style={[
            styles.puckTag,
            {
              backgroundColor: palette.plate,
              shadowColor: palette.plateShadow,
            },
          ]}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            style={[styles.puckTagText, { color: palette.label }]}
          >
            Demo start
          </Text>
        </View>
      )}
    </Animated.View>
  );
});

const PIN_W = 44;
const PIN_H = 58;
const PIN_BOX = 190;
const PIN_NAME = 22;

const Pin = memo(function Pin({
  point,
  name,
  scale,
  palette,
  reducedMotion,
}: {
  point: MapPoint;
  name: string;
  scale: SharedValue<number>;
  palette: MapPalette;
  reducedMotion: boolean;
}) {
  const reveal = useSharedValue(reducedMotion ? 1 : 0.4);
  useEffect(() => {
    reveal.value = reducedMotion
      ? 1
      : withSpring(1, { damping: 11, stiffness: 190, mass: 0.7 });
  }, [reducedMotion, reveal]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: reveal.value / scale.value }],
  }));
  return (
    <Animated.View
      style={[
        styles.pin,
        {
          left: point.x - PIN_BOX / 2,
          top: point.y - PIN_NAME - PIN_H + 4,
        },
        style,
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={[
          styles.pinName,
          { color: palette.label, textShadowColor: palette.halo },
        ]}
      >
        {name}
      </Text>
      <Svg
        width={PIN_W}
        height={PIN_H}
        viewBox={`0 0 ${PIN_W} ${PIN_H}`}
        accessible={false}
      >
        <Ellipse
          cx={22}
          cy={53.5}
          rx={8}
          ry={3}
          fill={palette.plateShadow}
          opacity={0.22}
        />
        <Path
          d="M22 53C22 53 6 36.5 6 22A16 16 0 0138 22C38 36.5 22 53 22 53Z"
          fill={palette.pin}
          stroke={palette.halo}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <Circle cx={22} cy={22} r={6.5} fill={palette.pinDot} />
      </Svg>
    </Animated.View>
  );
});

type Props = {
  floor: IndoorFloor;
  routes: RouteFloorSegment[];
  theme: Theme;
  places: POIItem[];
  destination: POIItem | null;
  scale: SharedValue<number>;
  /** The current zoom rounded to coarse steps, for work that redraws. */
  zoom: number;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  showPosition: boolean;
  position: MapPoint;
  nextPoint?: MapPoint;
  navigating: boolean;
  reducedMotion: boolean;
  arrived: boolean;
  showUnitLabels: boolean;
};

/** The map scene. Camera and touch handling live in IndoorMap. */
export const MapCanvas = memo(function MapCanvas({
  floor,
  routes,
  theme,
  places,
  destination,
  scale,
  zoom,
  positionX,
  positionY,
  showPosition,
  position,
  nextPoint,
  navigating,
  reducedMotion,
  arrived,
  showUnitLabels,
}: Props) {
  const palette = mapPalette(theme.isDark);
  const heading =
    navigating &&
    nextPoint &&
    (nextPoint.x !== position.x || nextPoint.y !== position.y)
      ? Math.round(
          Math.atan2(nextPoint.y - position.y, nextPoint.x - position.x) *
            10000,
        ) / 10000
      : undefined;
  const destinationId = destination?.id;
  const named = useMemo(
    () => floor.rooms.filter((room) => room.labelMode !== "detail" && room.label),
    [floor],
  );
  const full = useMemo(() => {
    const boxes: LabelBox[] = named
      .filter(
        (room) => room.id !== destinationId && (!room.demo || zoom >= 0.85),
      )
      .map((room) => {
        const lines = labelLines(room);
        return {
          id: room.id,
          point: room.label!,
          width: Math.max(
            BADGE + 4,
            Math.max(...lines.map((line) => line.length)) * 7.4,
          ),
          height: labelHeight(lines.length),
          priority: room.demo ? 1 : 2,
        };
      });
    return placeLabels(boxes, zoom);
  }, [destinationId, named, zoom]);
  const selectedRoom = destinationId
    ? floor.rooms.find((room) => room.id === destinationId)
    : undefined;

  return (
    <View
      pointerEvents="none"
      style={{ width: floor.bounds.width, height: floor.bounds.height }}
    >
      <MapBase
        floor={floor}
        palette={palette}
        places={places}
        showUnitLabels={showUnitLabels}
      />
      <MapRouteLayer
        routes={routes}
        room={selectedRoom}
        palette={palette}
        zoom={zoom}
        mode={arrived ? "complete" : navigating ? "active" : "preview"}
        position={navigating && showPosition ? position : undefined}
      />
      {floor.contextLabels?.map((label) => (
        <TextLabel
          key={label.id}
          label={label}
          palette={palette}
          scale={scale}
          variant="road"
        />
      ))}
      {!routes.length &&
        floor.labels.map((label) => (
        <TextLabel
          key={label.id}
          label={label}
          palette={palette}
          scale={scale}
          variant="area"
        />
        ))}
      {floor.facilities.map((facility) => (
        <FacilityLabel
          key={facility.id}
          point={facility.point}
          kind={facility.kind}
          palette={palette}
          scale={scale}
        />
      ))}
      {named.map((room) =>
        room.id === destinationId ? null : (
          <PlaceLabel
            key={room.id}
            room={room}
            palette={palette}
            scale={scale}
            full={full.has(room.id)}
          />
        ),
      )}
      {destination?.floorLevel === floor.level && (
        <Pin
          key={destination.id}
          point={destination.point}
          name={destination.name}
          scale={scale}
          palette={palette}
          reducedMotion={reducedMotion}
        />
      )}
      {showPosition && (
        <Puck
          x={positionX}
          y={positionY}
          scale={scale}
          palette={palette}
          heading={heading}
          directional={navigating && nextPoint !== undefined}
          navigating={navigating}
          reducedMotion={reducedMotion}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    width: ANCHOR_W,
    height: ANCHOR_H,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: LABEL_GAP,
    shadowOpacity: 0.22,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1.5 },
    elevation: 3,
  },
  dot: { width: 11, height: 11, borderRadius: 5.5, borderWidth: 2 },
  placeText: {
    fontFamily: fonts.rounded,
    fontSize: 12.5,
    lineHeight: LINE,
    fontWeight: "700",
    letterSpacing: -0.1,
    textAlign: "center",
    textShadowRadius: 2.5,
    textShadowOffset: { width: 0, height: 0 },
  },
  roadText: { fontSize: 11.5, fontWeight: "500", letterSpacing: 0.1 },
  areaText: { fontSize: 9.5, fontWeight: "700", letterSpacing: 1.4 },
  facility: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  puckFrame: {
    position: "absolute",
    left: 0,
    top: 0,
    width: PUCK,
    height: PUCK,
    alignItems: "center",
    justifyContent: "center",
  },
  puckPulse: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  puckHalo: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.16,
  },
  puckDisc: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  puckDiscLarge: { width: 34, height: 34, borderRadius: 17 },
  puckCore: { width: 16, height: 16, borderRadius: 8 },
  puckTag: {
    position: "absolute",
    top: PUCK / 2 + 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  puckTagText: { fontSize: 10.5, fontWeight: "700" },
  pin: {
    position: "absolute",
    width: PIN_BOX,
    height: PIN_NAME + PIN_H,
    alignItems: "center",
    transformOrigin: [PIN_BOX / 2, PIN_NAME + PIN_H - 4, 0],
  },
  pinName: {
    height: PIN_NAME,
    fontFamily: fonts.rounded,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
});
