import React from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Theme } from "../theme";
import { IndoorFloor, MapPoint, RouteFloorSegment } from "../map/types";

const pointsStr = (value: MapPoint[]) => value.map((point) => `${point.x},${point.y}`).join(" ");

const facilityGlyphs: Record<string, string> = {
  lift: "LIFT",
  escalator: "E2",
  restroom: "WC",
  information: "i",
  parking: "P",
  accessibility: "♿",
};

type Props = {
  floor: IndoorFloor;
  route?: RouteFloorSegment;
  theme: Theme;
  position: MapPoint;
  confidence?: "high" | "medium" | "low";
  showClosure?: boolean;
  selected?: boolean;
  progressAnimated?: number; // 0 to 1
  destinationPoint?: MapPoint;
  showRouteMarkers?: boolean;
};

export function MapCanvas({
  floor,
  route,
  theme,
  position,
  confidence = "high",
  showClosure,
  selected,
  progressAnimated = 1,
  destinationPoint,
  showRouteMarkers = false,
}: Props) {
  const dark = theme.isDark;
  
  // Cartography colors matching reference image
  const plateBg = dark ? "#1C1F26" : "#FFFFFF";
  const concourseBg = dark ? "#2A2E38" : "#F4F3ED";
  const roomBg = dark ? "#222630" : "#FAF9F4";
  const roomStroke = dark ? "#383E4B" : "#E2E0D6";
  const labelColor = dark ? "#E4E4E7" : "#18181B";
  const mutedText = dark ? "#9CA3AF" : "#71717A";

  // Position accuracy halo radius based on confidence
  const haloRadius = confidence === "low" ? 28 : confidence === "medium" ? 20 : 14;
  const haloColor = confidence === "low" ? theme.amber : dark ? "#3B82F6" : "#2563EB";

  // Slice polyline based on progressAnimated for smooth drawing
  const rawPolyline = route?.polyline ?? [];
  let visiblePolyline = rawPolyline;
  if (progressAnimated < 1 && rawPolyline.length >= 2) {
    const totalPoints = rawPolyline.length;
    const count = Math.max(2, Math.ceil(totalPoints * progressAnimated));
    visiblePolyline = rawPolyline.slice(0, count);
  }

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${floor.bounds.width} ${floor.bounds.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        {/* Multi-color gradient route inside black casing (Orange -> Coral -> Violet -> Blue) */}
        <LinearGradient id="atlasRouteGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={theme.routeStart} />
          <Stop offset="35%" stopColor={theme.routeMiddle} />
          <Stop offset="70%" stopColor={theme.routeViolet} />
          <Stop offset="100%" stopColor={theme.routeEnd} />
        </LinearGradient>

        {/* Start position glowing aura */}
        <LinearGradient id="startGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={theme.routeStart} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={theme.routeMiddle} stopOpacity="0.05" />
        </LinearGradient>
      </Defs>

      {/* Venue Outer Footprint Plate */}
      <Polygon
        points={pointsStr(floor.plate)}
        fill={plateBg}
        stroke={roomStroke}
        strokeWidth="1.5"
      />

      {/* Concourse & Corridors */}
      {floor.concourses.map((concourse, index) => (
        <Polygon
          key={`concourse-${index}`}
          points={pointsStr(concourse)}
          fill={concourseBg}
          stroke={roomStroke}
          strokeWidth="1"
        />
      ))}

      {/* Atrium Circle Feature */}
      <Circle
        cx="191"
        cy="278"
        r="64"
        fill={plateBg}
        stroke={roomStroke}
        strokeWidth="1.5"
      />

      {/* Venue Rooms / Stores */}
      {floor.rooms.map((mapRoom) => {
        const isDest = mapRoom.destination;
        return (
          <G key={mapRoom.id}>
            <Polygon
              points={pointsStr(mapRoom.points)}
              fill={isDest ? (dark ? "#2E2818" : "#FFFBEB") : roomBg}
              stroke={isDest ? theme.amber : roomStroke}
              strokeWidth={isDest ? "2" : "1"}
            />
            {mapRoom.entrance && (
              <Line
                x1={mapRoom.entrance.from.x}
                y1={mapRoom.entrance.from.y}
                x2={mapRoom.entrance.to.x}
                y2={mapRoom.entrance.to.y}
                stroke={concourseBg}
                strokeWidth="6"
              />
            )}
            {mapRoom.label && (
              <SvgText
                x={mapRoom.label.x}
                y={mapRoom.label.y}
                fill={isDest ? theme.ink : labelColor}
                fontSize={mapRoom.name.length > 11 ? 7.5 : 8.5}
                fontWeight="700"
                textAnchor="middle"
              >
                {mapRoom.name}
              </SvgText>
            )}
            {isDest && (
              <SvgText
                x={mapRoom.label?.x ?? 319}
                y={(mapRoom.label?.y ?? 47) + 14}
                fill={theme.amber}
                fontSize="6"
                fontWeight="800"
                textAnchor="middle"
              >
                ★ DESTINATION
              </SvgText>
            )}
          </G>
        );
      })}

      {/* Concourse & Area Labels */}
      {floor.labels.map((label) => (
        <SvgText
          key={label.id}
          x={label.point.x}
          y={label.point.y}
          fill={mutedText}
          fontSize={label.prominent ? 8 : 6.5}
          fontWeight="700"
          letterSpacing="1.2"
          textAnchor="middle"
          transform={
            label.rotate
              ? `rotate(${label.rotate} ${label.point.x} ${label.point.y})`
              : undefined
          }
        >
          {label.text}
        </SvgText>
      ))}

      {/* Facilities (Lifts, Escalators, Restrooms, Info) */}
      {floor.facilities.map((facility) => (
        <G key={facility.id}>
          <Rect
            x={facility.point.x - 16}
            y={facility.point.y - 12}
            width="32"
            height="24"
            rx="8"
            fill={dark ? "#262932" : "#FFFFFF"}
            stroke={roomStroke}
            strokeWidth="1"
          />
          <SvgText
            x={facility.point.x}
            y={facility.point.y + 4}
            fill={facility.kind === "information" ? theme.accent : theme.ink}
            fontSize={facility.kind === "information" ? 13 : 8}
            fontWeight="800"
            textAnchor="middle"
          >
            {facilityGlyphs[facility.kind] ?? "•"}
          </SvgText>
        </G>
      ))}

      {/* Closure Warning Badge if any */}
      {showClosure && floor.closure && (
        <G>
          <Circle
            cx={floor.closure.x}
            cy={floor.closure.y}
            r="12"
            fill={theme.danger}
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <Line
            x1={floor.closure.x - 4}
            y1={floor.closure.y}
            x2={floor.closure.x + 4}
            y2={floor.closure.y}
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </G>
      )}

      {/* ROUTE DRAWING (Thick Black Outer Casing + Vibrant Multi-color Inner Line) */}
      {visiblePolyline.length >= 2 && (
        <G>
          {/* Thick Dark/Black Route Casing */}
          <Polyline
            points={pointsStr(visiblePolyline)}
            fill="none"
            stroke={theme.routeCasing}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Narrower Colored Route Line Inside (Orange -> Coral -> Violet -> Blue Gradient) */}
          <Polyline
            points={pointsStr(visiblePolyline)}
            fill="none"
            stroke="url(#atlasRouteGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}

      {/* Start Point Glowing Marker (Ground Floor start) */}
      {showRouteMarkers && floor.level === 1 && (
        <G>
          <Circle cx="190" cy="438" r="18" fill="url(#startGlow)" />
          <Circle
            cx="190"
            cy="438"
            r="9"
            fill="#FFFFFF"
            stroke={theme.routeStart}
            strokeWidth="3.5"
          />
          <Circle cx="190" cy="438" r="3.5" fill={theme.routeStart} />
        </G>
      )}

      {/* Floor Transition Badge (Escalator / Lift at junction) */}
      {route?.transitionAt && (
        <G>
          <Circle
            cx={route.transitionAt.x}
            cy={route.transitionAt.y}
            r="14"
            fill={theme.paper}
            stroke={theme.routeCasing}
            strokeWidth="3"
          />
          <Circle
            cx={route.transitionAt.x}
            cy={route.transitionAt.y}
            r="10"
            fill={theme.routeMiddle}
          />
          <SvgText
            x={route.transitionAt.x}
            y={route.transitionAt.y + 4}
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="900"
            textAnchor="middle"
          >
            L{route.transitionToLevel ?? 2}
          </SvgText>
        </G>
      )}

      {/* Destination Pin (Level 2) */}
      {showRouteMarkers && floor.level === 2 && destinationPoint && (
        <G>
          {/* Drop Shadow / Base ring */}
          <Ellipse
            cx={destinationPoint?.x ?? 318}
            cy={(destinationPoint?.y ?? 96) + 12}
            rx="10"
            ry="4"
            fill="rgba(0,0,0,0.18)"
          />
          {/* Pin Body */}
          <Path
            d={`M${destinationPoint?.x ?? 318} ${(destinationPoint?.y ?? 96) - 22} C${(destinationPoint?.x ?? 318) - 12} ${(destinationPoint?.y ?? 96) - 22} ${(destinationPoint?.x ?? 318) - 12} ${(destinationPoint?.y ?? 96) - 10} ${(destinationPoint?.x ?? 318)} ${(destinationPoint?.y ?? 96) + 8} C${(destinationPoint?.x ?? 318) + 12} ${(destinationPoint?.y ?? 96) - 10} ${(destinationPoint?.x ?? 318) + 12} ${(destinationPoint?.y ?? 96) - 22} ${(destinationPoint?.x ?? 318)} ${(destinationPoint?.y ?? 96) - 22} Z`}
            fill={theme.routeCasing}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          {/* Inner Accent Dot */}
          <Circle
            cx={destinationPoint?.x ?? 318}
            cy={(destinationPoint?.y ?? 96) - 12}
            r="4.5"
            fill={theme.routeStart}
          />
        </G>
      )}

      {/* Active Animated Current Position Marker & Direction Cone */}
      <G>
        {/* Accuracy Halo */}
        <Circle
          cx={position.x}
          cy={position.y}
          r={haloRadius}
          fill={haloColor}
          opacity="0.22"
          stroke={confidence === "low" ? theme.amber : "none"}
          strokeDasharray={confidence === "low" ? "3 3" : undefined}
        />

        {/* Directional Field Cone */}
        {confidence === "high" && (
          <Path
            d={`M${position.x} ${position.y - 8} L${position.x - 12} ${position.y - 28} L${position.x + 12} ${position.y - 28} Z`}
            fill={dark ? "#60A5FA" : "#2563EB"}
            opacity="0.3"
          />
        )}

        {/* Position Dot */}
        <Circle
          cx={position.x}
          cy={position.y}
          r={selected ? 10 : 7}
          fill={confidence === "low" ? theme.amber : dark ? "#60A5FA" : "#2563EB"}
          stroke={theme.paper}
          strokeWidth="3"
        />

        {selected && (
          <Circle
            cx={position.x}
            cy={position.y}
            r="16"
            fill="none"
            stroke={theme.accent}
            strokeWidth="2"
          />
        )}
      </G>
    </Svg>
  );
}
