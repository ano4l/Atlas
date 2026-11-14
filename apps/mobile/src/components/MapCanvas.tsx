import React, { memo, useEffect, useMemo } from "react";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Pattern,
  LinearGradient,
  Stop,
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
  runOnUI,
  SharedValue,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Theme } from "../theme";
import {
  IndoorFloor,
  MapPoint,
  MapRoom,
  POIItem,
  RouteFloorSegment,
} from "../map/types";
import { storeNameLines } from "../map/viewport";

const AnimatedText = Animated.createAnimatedComponent(SvgText);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const points = (items: MapPoint[]) =>
  items.map((p) => `${p.x},${p.y}`).join(" ");
const PLACE_LABEL_SIZE = 10;
const LABEL_LINE_HEIGHT = 1.16;
const placeLabelOffset = (lineCount: number) => (lineCount > 1 ? 11 : 8);

export function hitsStoreLabel(
  room: MapRoom,
  point: MapPoint,
  scale: number,
  fontScale: number,
) {
  if (!room.label || room.labelMode === "detail" || (room.demo && scale < 0.85))
    return false;
  const lines = storeNameLines(room.name);
  const offset = placeLabelOffset(lines.length);
  const x = (point.x - room.label.x) * scale;
  const y = (point.y - room.label.y) * scale;
  if (Math.hypot(x, y + offset) <= 10) return true;
  const size = PLACE_LABEL_SIZE * Math.min(fontScale, 1.35);
  return lines.some((line, index) => {
    const center =
      offset + (index - (lines.length - 1) / 2) * size * LABEL_LINE_HEIGHT;
    return (
      Math.abs(y - center) <= size / 2 + 2 &&
      Math.abs(x) <= line.length * size * 0.29 + 3
    );
  });
}

function centeredLabelFont(fontSize: number) {
  "worklet";
  // The Android SVG font-size setter replaces the font map, including the anchor.
  return {
    fontSize,
    textAnchor: "middle" as const,
    fontWeight: "600" as const,
  };
}

// Units are the figure and the corridor is the ground: every fill sits clearly
// below the corridor's lightness, and tints stay distinguishable from the
// neutral used for units whose tenant is not confirmed.
export function storeFill(category: string, dark: boolean) {
  if (category === "Unconfirmed tenant") return dark ? "#36444E" : "#DCE1DB";
  if (/Dining|Food/.test(category)) return dark ? "#5A4636" : "#F7DDBB";
  if (/Health/.test(category)) return dark ? "#35574A" : "#CFE8D6";
  if (/Electronics/.test(category)) return dark ? "#2C4F66" : "#CFE3F3";
  if (/Home|Entertainment|Books/.test(category))
    return dark ? "#4A4566" : "#E1D5F0";
  return dark ? "#3E4E69" : "#D3DFF3";
}

function NameLine({
  text,
  x,
  y,
  line,
  count,
  scale,
  color,
  fontScale,
  fontSize = 12,
  maxWidth = 184,
  maxHeight = 200,
  visibleFrom = 0,
  offset = 0,
}: {
  text: string;
  x: number;
  y: number;
  line: number;
  count: number;
  scale: SharedValue<number>;
  color: string;
  fontScale: number;
  fontSize?: number;
  maxWidth?: number;
  maxHeight?: number;
  visibleFrom?: number;
  offset?: number;
}) {
  const props = useAnimatedProps(() => {
    const size = Math.min(
      maxWidth / Math.max(1, text.length * 0.56),
      maxHeight / Math.max(1, count * 1.3),
      (fontSize / scale.value) * Math.min(fontScale, 1.35),
    );
    return {
      font: centeredLabelFont(size),
      opacity: scale.value >= visibleFrom ? 1 : 0,
      y:
        y +
        offset / scale.value +
        (line - (count - 1) / 2) * size * LABEL_LINE_HEIGHT +
        size * 0.34,
    };
  });
  return (
    <AnimatedText
      animatedProps={props}
      x={x}
      textAnchor="middle"
      fill={color}
      fontWeight="600"
    >
      {text}
    </AnimatedText>
  );
}

function PlaceSymbol({
  point,
  scale,
  color,
  paper,
  kind,
  offset,
}: {
  point: MapPoint;
  scale: SharedValue<number>;
  color: string;
  paper: string;
  kind: "shop" | "food" | "health";
  offset: number;
}) {
  const circle = useAnimatedProps(() => ({
    cy: point.y - offset / scale.value,
    r: 7.5 / scale.value,
    strokeWidth: 1 / scale.value,
  }));
  const icon = useAnimatedProps(() => {
    const size = 1 / scale.value;
    const x = point.x;
    const y = point.y - offset * size;
    let d: string;
    if (kind === "health") {
      d = `M${x - 3.5 * size},${y}h${7 * size} M${x},${y - 3.5 * size}v${7 * size}`;
    } else if (kind === "food") {
      d = `M${x - 2.8 * size},${y - 3.5 * size}v${2.2 * size}q0,${1.8 * size} ${1.8 * size},${1.8 * size}q${1.8 * size},0 ${1.8 * size},${-1.8 * size}v${-2.2 * size} M${x - size},${y - 3.5 * size}v${7 * size} M${x + 3.3 * size},${y - 3.5 * size}v${7 * size}`;
    } else {
      d = `M${x - 3.6 * size},${y - 1.5 * size}h${7.2 * size}l${-0.5 * size},${5.4 * size}h${-6.2 * size}z M${x - 1.6 * size},${y - 1.5 * size}v${-0.9 * size}a${1.6 * size},${1.6 * size} 0 0 1 ${3.2 * size},0v${0.9 * size}`;
    }
    return { d, strokeWidth: 1.15 * size };
  });
  return (
    <G>
      <AnimatedCircle
        animatedProps={circle}
        cx={point.x}
        fill={color}
        stroke={paper}
      />
      <AnimatedPath
        animatedProps={icon}
        fill="none"
        stroke={paper}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

function StoreLabel({
  room,
  poi,
  selected,
  scale,
  theme,
  fontScale,
}: {
  room: MapRoom;
  poi?: POIItem;
  selected: boolean;
  scale: SharedValue<number>;
  theme: Theme;
  fontScale: number;
}) {
  const center = room.label;
  if (!center) return null;
  const isDetail = room.labelMode === "detail";
  const lines = isDetail
    ? [poi?.unitLabel || room.name]
    : room.demo && room.name.includes(" ")
      ? [
          room.name.slice(0, room.name.lastIndexOf(" ")),
          room.name.slice(room.name.lastIndexOf(" ") + 1),
        ]
      : storeNameLines(room.name);
  const xs = room.points.map((point) => point.x);
  const ys = room.points.map((point) => point.y);
  const width = Math.max(
    1,
    Math.min(Math.max(...xs) - center.x, center.x - Math.min(...xs)) * 2 - 8,
  );
  const height = Math.max(
    1,
    Math.min(Math.max(...ys) - center.y, center.y - Math.min(...ys)) * 2 - 8,
  );
  const kind = /Dining|Food/.test(room.category ?? "")
    ? "food"
    : /Health/.test(room.category ?? "")
      ? "health"
      : "shop";
  const color = selected
    ? theme.accent
    : isDetail
      ? theme.muted
      : theme.inkSecondary;
  const showSymbol = !isDetail && !selected && !room.demo;
  const offset = showSymbol ? placeLabelOffset(lines.length) : 0;
  const smallUnit = isDetail && !selected;
  const constrainToRoom = smallUnit || !!room.demo || (selected && !isDetail);
  return (
    <G>
      {showSymbol && (
        <PlaceSymbol
          point={center}
          scale={scale}
          color={color}
          paper={theme.paper}
          kind={kind}
          offset={offset}
        />
      )}
      {lines.map((text, i) => (
        <NameLine
          key={i}
          text={text}
          x={center.x}
          y={center.y}
          line={i}
          count={lines.length}
          scale={scale}
          color={color}
          fontScale={fontScale}
          fontSize={isDetail ? 9 : PLACE_LABEL_SIZE}
          maxWidth={constrainToRoom ? width : Infinity}
          maxHeight={constrainToRoom ? height : Infinity}
          visibleFrom={
            room.demo && !selected
              ? 0.85
              : smallUnit
                ? 7 / Math.min(width / (text.length * 0.56), height / 1.3)
                : 0
          }
          offset={offset}
        />
      ))}
    </G>
  );
}

function AreaLabel({
  text,
  point,
  scale,
  color,
  rotation = 0,
  visibleFrom = 0,
}: {
  text: string;
  point: MapPoint;
  scale: SharedValue<number>;
  color: string;
  rotation?: number;
  visibleFrom?: number;
}) {
  return (
    <G transform={`rotate(${rotation} ${point.x} ${point.y})`}>
      <NameLine
        text={text}
        x={point.x}
        y={point.y}
        line={0}
        count={1}
        scale={scale}
        color={color}
        fontScale={0.92}
        fontSize={10}
        visibleFrom={visibleFrom}
      />
    </G>
  );
}

function Facility({
  point,
  glyph,
  scale,
  theme,
}: {
  point: MapPoint;
  glyph: string;
  scale: SharedValue<number>;
  theme: Theme;
}) {
  const boxProps = useAnimatedProps(() => ({
    x: point.x - 12 / scale.value,
    y: point.y - 12 / scale.value,
    width: 24 / scale.value,
    height: 24 / scale.value,
    rx: 7 / scale.value,
    strokeWidth: 1 / scale.value,
  }));
  const textProps = useAnimatedProps(() => ({
    font: centeredLabelFont(12 / scale.value),
    y: point.y + 4 / scale.value,
  }));
  return (
    <G>
      <AnimatedRect
        animatedProps={boxProps}
        fill={theme.paper}
        stroke={theme.mapStroke}
      />
      <AnimatedText
        animatedProps={textProps}
        x={point.x}
        textAnchor="middle"
        fill={theme.inkSecondary}
        fontWeight="600"
      >
        {glyph}
      </AnimatedText>
    </G>
  );
}

function RouteStroke({
  line,
  scale,
  color,
  width,
  totalLength,
  progress,
  dotted = false,
}: {
  line: string;
  scale: SharedValue<number>;
  color: string;
  width: number;
  totalLength?: number;
  progress?: SharedValue<number>;
  dotted?: boolean;
}) {
  const props = useAnimatedProps(() => ({
    strokeWidth: width / scale.value,
    ...(dotted
      ? { strokeDasharray: [0.3 / scale.value, 8.8 / scale.value] }
      : {}),
    strokeDashoffset: progress ? -progress.value : 0,
    opacity:
      progress && totalLength && progress.value >= totalLength - 0.1 ? 0 : 1,
  }));
  return (
    <AnimatedPolyline
      animatedProps={props}
      points={line}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={
        dotted
          ? [0.6, 17.6]
          : totalLength
            ? [totalLength + 1, totalLength + 1]
            : undefined
      }
    />
  );
}

function RouteArrow({
  point,
  angle,
  distance,
  progress,
  scale,
  color,
}: {
  point: MapPoint;
  angle: number;
  distance: number;
  progress: SharedValue<number>;
  scale: SharedValue<number>;
  color: string;
}) {
  const props = useAnimatedProps(() => {
    const zoom = scale.value;
    if (zoom < 0.4 || progress.value + 14 / zoom >= distance) {
      return { d: "M0,0", strokeWidth: 0 };
    }
    const size = 2.4 / zoom;
    const dx = Math.cos(angle) * size;
    const dy = Math.sin(angle) * size;
    return {
      d: `M${point.x - dx - dy},${point.y - dy + dx} L${point.x + dx},${point.y + dy} L${point.x - dx + dy},${point.y - dy - dx}`,
      strokeWidth: 1.5 / zoom,
    };
  });
  return (
    <AnimatedPath
      animatedProps={props}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

const MapRoute = memo(function MapRoute({
  path,
  scale,
  theme,
  positionX,
  positionY,
  trackPosition,
  preview,
  complete,
}: {
  path: MapPoint[];
  scale: SharedValue<number>;
  theme: Theme;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  trackPosition: boolean;
  preview: boolean;
  complete: boolean;
}) {
  const { line, segments, totalLength } = useMemo(() => {
    let totalLength = 0;
    const segments = path.slice(1).map((point, i) => {
      const start = path[i];
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      const length = Math.hypot(dx, dy);
      const segment = { start, dx, dy, length, offset: totalLength };
      totalLength += length;
      return segment;
    });
    return { line: points(path), segments, totalLength };
  }, [path]);
  const progress = useDerivedValue(() => {
    if (!trackPosition) return 0;
    let nearest = Infinity;
    let completed = 0;
    for (const { start, dx, dy, length, offset } of segments) {
      if (!length) continue;
      const x = positionX.value - start.x;
      const y = positionY.value - start.y;
      const fraction = Math.max(
        0,
        Math.min(1, (x * dx + y * dy) / (length * length)),
      );
      const distance = Math.hypot(x - fraction * dx, y - fraction * dy);
      if (distance < nearest) {
        nearest = distance;
        completed = offset + fraction * length;
      }
    }
    return completed;
  });
  return (
    <G>
      <RouteStroke
        line={line}
        scale={scale}
        color={theme.routeCasing}
        width={preview ? 7.5 : 11}
        dotted={preview}
      />
      {trackPosition && (
        <RouteStroke
          line={line}
          scale={scale}
          color={theme.mapStroke}
          width={7}
        />
      )}
      <RouteStroke
        line={line}
        scale={scale}
        color={complete ? theme.muted : theme.routeStart}
        width={preview ? 5 : 7}
        totalLength={trackPosition ? totalLength : undefined}
        progress={trackPosition ? progress : undefined}
        dotted={preview}
      />
      {!preview &&
        !complete &&
        segments.map(({ start, dx, dy, length, offset }) =>
          length >= 95 ? (
            <RouteArrow
              key={offset}
              point={{ x: start.x + dx / 2, y: start.y + dy / 2 }}
              angle={Math.atan2(dy, dx)}
              distance={offset + length / 2}
              progress={progress}
              scale={scale}
              color={theme.primaryText}
            />
          ) : null,
        )}
    </G>
  );
});

const Position = memo(function Position({
  x,
  y,
  scale,
  theme,
  heading,
  directional,
  navigating,
  reducedMotion,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  theme: Theme;
  heading?: number;
  directional: boolean;
  navigating: boolean;
  reducedMotion: boolean;
}) {
  const bearing = useSharedValue(heading ?? 0);
  useEffect(() => {
    if (heading === undefined) return;
    runOnUI((angle: number, immediate: boolean) => {
      "worklet";
      const delta = angle - bearing.value;
      const turn = Math.atan2(Math.sin(delta), Math.cos(delta));
      bearing.value = withTiming(bearing.value + turn, {
        duration: immediate ? 0 : 180,
        easing: Easing.out(Easing.cubic),
      });
    })(heading, reducedMotion);
  }, [bearing, heading, reducedMotion]);
  const halo = useAnimatedProps(() => ({
    cx: x.value,
    cy: y.value,
    r: (navigating ? 21 : 16) / scale.value,
  }));
  const dot = useAnimatedProps(() => ({
    cx: x.value,
    cy: y.value,
    r: 7 / scale.value,
    strokeWidth: 2.5 / scale.value,
  }));
  const arrow = useAnimatedProps(() => {
    const unit = 1 / scale.value;
    const dx = Math.cos(bearing.value) * unit;
    const dy = Math.sin(bearing.value) * unit;
    const cx = x.value;
    const cy = y.value;
    return {
      d: `M${cx + dx * 13},${cy + dy * 13} L${cx - dx * 9 - dy * 8},${cy - dy * 9 + dx * 8} L${cx - dx * 5},${cy - dy * 5} L${cx - dx * 9 + dy * 8},${cy - dy * 9 - dx * 8} Z`,
      strokeWidth: 2.5 * unit,
    };
  });
  const labelBox = useAnimatedProps(() => ({
    x: x.value - 30 / scale.value,
    y: y.value + 18 / scale.value,
    width: 60 / scale.value,
    height: 18 / scale.value,
    rx: 9 / scale.value,
    strokeWidth: 1 / scale.value,
  }));
  const label = useAnimatedProps(() => ({
    x: x.value,
    y: y.value + 30.5 / scale.value,
    font: centeredLabelFont(9 / scale.value),
  }));
  return (
    <G>
      <AnimatedCircle
        animatedProps={halo}
        fill={theme.routeStart}
        opacity={0.19}
      />
      {directional ? (
        <AnimatedPath
          animatedProps={arrow}
          fill={theme.routeStart}
          stroke={theme.routeCasing}
          strokeLinejoin="round"
        />
      ) : (
        <AnimatedCircle
          animatedProps={dot}
          fill={theme.routeStart}
          stroke={theme.routeCasing}
        />
      )}
      {!navigating && (
        <>
          <AnimatedRect
            animatedProps={labelBox}
            fill={theme.paper}
            stroke={theme.line}
          />
          <AnimatedText
            animatedProps={label}
            textAnchor="middle"
            fill={theme.inkSecondary}
            fontWeight="600"
          >
            Demo start
          </AnimatedText>
        </>
      )}
    </G>
  );
});

const Destination = memo(function Destination({
  point,
  scale,
  theme,
  reducedMotion,
}: {
  point: MapPoint;
  scale: SharedValue<number>;
  theme: Theme;
  reducedMotion: boolean;
}) {
  const reveal = useSharedValue(reducedMotion ? 1 : 0.82);
  useEffect(() => {
    reveal.value = withTiming(1, {
      duration: reducedMotion ? 0 : 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [reducedMotion, reveal]);
  const pin = useAnimatedProps(() => {
    const unit = reveal.value / scale.value;
    const left = point.x - 10 * unit;
    const right = point.x + 10 * unit;
    const centerY = point.y - 16 * unit;
    const top = point.y - 26 * unit;
    return {
      d: `M${point.x},${point.y} C${point.x - 3 * unit},${point.y - 5 * unit} ${left},${centerY + 6 * unit} ${left},${centerY} A${10 * unit},${10 * unit} 0 0,1 ${point.x},${top} A${10 * unit},${10 * unit} 0 0,1 ${right},${centerY} C${right},${centerY + 6 * unit} ${point.x + 3 * unit},${point.y - 5 * unit} ${point.x},${point.y} Z`,
      strokeWidth: 2 * unit,
    };
  });
  const dot = useAnimatedProps(() => ({
    cy: point.y - (16 * reveal.value) / scale.value,
    r: (3.1 * reveal.value) / scale.value,
  }));
  return (
    <G>
      <AnimatedPath
        animatedProps={pin}
        fill={theme.danger}
        stroke={theme.routeCasing}
      />
      <AnimatedCircle
        animatedProps={dot}
        cx={point.x}
        fill={theme.routeCasing}
      />
    </G>
  );
});

type Props = {
  floor: IndoorFloor;
  routes: RouteFloorSegment[];
  theme: Theme;
  places: POIItem[];
  destination: POIItem | null;
  scale: SharedValue<number>;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  showPosition: boolean;
  position: MapPoint;
  nextPoint?: MapPoint;
  navigating: boolean;
  reducedMotion: boolean;
  arrived: boolean;
  fontScale: number;
  showUnitLabels: boolean;
};
/** Native vector scene only. Camera and touch handling live in IndoorMap. */
export const MapCanvas = memo(function MapCanvas({
  floor,
  routes,
  theme,
  places,
  destination,
  scale,
  positionX,
  positionY,
  showPosition,
  position,
  nextPoint,
  navigating,
  reducedMotion,
  arrived,
  fontScale,
  showUnitLabels,
}: Props) {
  const poiById = useMemo(
    () => new Map(places.map((place) => [place.id, place])),
    [places],
  );
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
  const geometry = useMemo(
    () => (
      <>
        {/* Context is traced from the supplied schematic, independent of the camera. */}
        {floor.siteBoundary && (
          <Polygon
            points={points(floor.siteBoundary)}
            fill={theme.isDark ? "#263B3E" : "#E1EAE2"}
          />
        )}
        {floor.contextRoad && (
          <>
            <Path
              d={floor.contextRoad}
              stroke={theme.isDark ? "#3A4B58" : "#D8E1DE"}
              strokeWidth={52}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={floor.contextRoad}
              stroke={theme.isDark ? "#303F4D" : "#FDFDFC"}
              strokeWidth={48}
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
        <Polygon
          points={points(floor.plate)}
          transform="translate(0 4)"
          fill={theme.shadow}
          opacity={0.05}
        />
        <Polygon
          points={points(floor.plate)}
          fill={theme.mapCorridor}
          stroke={theme.mapStroke}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        {floor.walkways?.map((path, index) => (
          <Polyline
            key={index}
            points={points(path)}
            fill="none"
            stroke={theme.mapConcourse}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        <Defs>
          <LinearGradient id="shop-glaze" x1="0" y1="0" x2="1" y2="1">
            <Stop
              offset="0"
              stopColor="#FFFFFF"
              stopOpacity={theme.isDark ? 0.025 : 0.16}
            />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <ClipPath id="concourse-clip">
            <Polygon points={points(floor.plate)} />
          </ClipPath>
          <Pattern
            id="concourse-tiles"
            width={24}
            height={24}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d="M24 0H0V24"
              fill="none"
              stroke={theme.mapStroke}
              strokeWidth={0.5}
              opacity={0.08}
            />
          </Pattern>
        </Defs>
        <G clipPath="url(#concourse-clip)" pointerEvents="none">
          <Rect
            x={0}
            y={0}
            width={1600}
            height={1600}
            fill="url(#concourse-tiles)"
          />
        </G>
        {floor.courts?.map((court, i) => (
          <G key={i} pointerEvents="none">
            <Circle
              cx={court.point.x}
              cy={court.point.y}
              r={court.radius}
              fill={theme.mapPlate}
              stroke={theme.mapStroke}
              strokeWidth={2}
            />
            <Circle
              cx={court.point.x}
              cy={court.point.y}
              r={court.radius * 0.82}
              fill="none"
              stroke={theme.mapStroke}
              strokeWidth={0.7}
              opacity={0.55}
            />
            {/* Illustrative landscaping stays clear of the gallery route through the court. */}
            {[
              [-28, 6],
              [18, -27],
              [28, 18],
            ].map(([dx, dy], index) => (
              <G key={index}>
                <Circle
                  cx={court.point.x + dx + 2}
                  cy={court.point.y + dy + 3}
                  r={9}
                  fill={theme.shadow}
                  opacity={0.12}
                />
                <Circle
                  cx={court.point.x + dx}
                  cy={court.point.y + dy}
                  r={9}
                  fill={theme.isDark ? "#34524B" : "#C3D8BF"}
                  stroke={theme.isDark ? "#45665B" : "#A8C4A5"}
                  strokeWidth={1}
                />
                <Circle
                  cx={court.point.x + dx - 2}
                  cy={court.point.y + dy - 2}
                  r={5}
                  fill={theme.isDark ? "#42665B" : "#DAE8CE"}
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
                fill={theme.isDark ? "#7B6B55" : "#BD9D77"}
              />
            ))}
          </G>
        ))}
        {floor.contextLabels?.map((label) => (
          <AreaLabel
            key={label.id}
            text={label.text}
            point={label.point}
            scale={scale}
            color={theme.muted}
            rotation={label.rotate}
          />
        ))}
        {/* Shallow wall faces give the scene depth while retaining exact touch footprints. */}
        {floor.rooms.map((room) => {
          if (room.labelMode === "detail") return null;
          const depth = 2.5;
          return (
            <G key={`walls-${room.id}`} pointerEvents="none">
              <Polygon
                points={points(room.points)}
                transform={`translate(1 ${depth + 1})`}
                fill={theme.shadow}
                opacity={theme.isDark ? 0.12 : 0.045}
              />
              {room.points.map((a, index) => {
                const b = room.points[(index + 1) % room.points.length];
                if (b.y - a.y - (b.x - a.x) * depth <= 0) return null;
                return (
                  <Polygon
                    key={index}
                    points={points([
                      a,
                      b,
                      { x: b.x + 1, y: b.y + depth },
                      { x: a.x + 1, y: a.y + depth },
                    ])}
                    fill={b.y > a.y ? theme.mapWall : theme.mapWallLit}
                  />
                );
              })}
            </G>
          );
        })}
        {floor.rooms.map((room) => (
          <G key={room.id}>
            <Polygon
              points={points(room.points)}
              fill={
                destinationId === room.id
                  ? theme.accentSoft
                  : storeFill(room.category ?? "", theme.isDark)
              }
              stroke={
                destinationId === room.id
                  ? theme.accent
                  : theme.mapUnitStroke
              }
              strokeWidth={
                destinationId === room.id
                  ? 3
                  : room.labelMode === "detail"
                    ? 0.8
                    : 1.2
              }
              strokeLinejoin="round"
            />
            <Polygon
              points={points(room.points)}
              fill="url(#shop-glaze)"
              pointerEvents="none"
            />
            {room.entrance && (
              <>
                <Line
                  x1={room.entrance.from.x}
                  y1={room.entrance.from.y}
                  x2={room.entrance.to.x}
                  y2={room.entrance.to.y}
                  stroke={theme.mapConcourse}
                  strokeWidth={6}
                />
                <Line
                  x1={room.entrance.from.x}
                  y1={room.entrance.from.y + 4}
                  x2={room.entrance.to.x}
                  y2={room.entrance.to.y - 4}
                  stroke={
                    destinationId === room.id ? theme.accent : theme.mapStroke
                  }
                  strokeWidth={2}
                />
              </>
            )}
          </G>
        ))}
        {floor.labels.map((label) => (
          <AreaLabel
            key={label.id}
            text={label.text}
            point={label.point}
            scale={scale}
            color={theme.muted}
            rotation={label.rotate}
            visibleFrom={0.8}
          />
        ))}
        {floor.rooms.map((room) =>
          room.labelMode !== "detail" ||
          showUnitLabels ||
          destinationId === room.id ? (
            <StoreLabel
              key={room.id}
              room={room}
              poi={poiById.get(room.id)}
              selected={destinationId === room.id}
              scale={scale}
              theme={theme}
              fontScale={fontScale}
            />
          ) : null,
        )}
        {floor.facilities.map((f) => (
          <Facility
            key={f.id}
            point={f.point}
            glyph={
              f.kind === "lift"
                ? "↕"
                : f.kind === "escalator"
                  ? "↗"
                  : f.kind === "restroom"
                    ? "WC"
                    : "i"
            }
            scale={scale}
            theme={theme}
          />
        ))}
        {floor.walkways && places.filter((place) => place.floorLevel === floor.level).map((place) => (
          <Circle key={place.id} cx={place.point.x} cy={place.point.y} r={2.2}
            fill={theme.accent} stroke={theme.mapConcourse} strokeWidth={0.8} />
        ))}
      </>
    ),
    [destinationId, floor, fontScale, places, poiById, scale, showUnitLabels, theme],
  );

  return (
    <Svg
      width={floor.bounds.width}
      height={floor.bounds.height}
      viewBox={`0 0 ${floor.bounds.width} ${floor.bounds.height}`}
      accessible={false}
    >
      {geometry}
      {routes.filter((route) => route.polyline.length > 1).map((route, index) => (
        <MapRoute
          key={`${arrived ? "complete" : navigating ? "active" : "preview"}-${index}`}
          path={route.polyline}
          scale={scale}
          theme={theme}
          positionX={positionX}
          positionY={positionY}
          trackPosition={navigating && showPosition}
          preview={!navigating && !arrived}
          complete={arrived}
        />
      ))}
      {destination?.floorLevel === floor.level && (
        <Destination
          key={destination.id}
          point={destination.point}
          scale={scale}
          theme={theme}
          reducedMotion={reducedMotion}
        />
      )}
      {showPosition && (
        <Position
          x={positionX}
          y={positionY}
          scale={scale}
          theme={theme}
          heading={heading}
          directional={navigating && nextPoint !== undefined}
          navigating={navigating}
          reducedMotion={reducedMotion}
        />
      )}
    </Svg>
  );
});
