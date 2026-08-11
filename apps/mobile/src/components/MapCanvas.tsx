import React from "react";
import Svg, { Circle, G, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { Theme } from "../theme";
import { IndoorFloor, MapPoint, RouteFloorSegment } from "../map/types";

const points = (items: MapPoint[]) => items.map(({ x, y }) => `${x},${y}`).join(" ");
const glyphs: Record<string, string> = { lift: "↕", escalator: "↗", restroom: "WC", information: "i", parking: "P", accessibility: "A" };

type Props = {
  floor: IndoorFloor; route?: RouteFloorSegment; theme: Theme; position: MapPoint;
  confidence?: "high" | "medium" | "low"; showClosure?: boolean; selected?: boolean;
  progressAnimated?: number; destinationPoint?: MapPoint; showRouteMarkers?: boolean;
};

export function MapCanvas({ floor, route, theme, position, confidence = "high", showClosure,
  selected, progressAnimated = 1, destinationPoint, showRouteMarkers = false }: Props) {
  const dark = theme.isDark;
  const routePoints = route?.polyline ?? [];
  const visible = progressAnimated < 1 && routePoints.length > 1
    ? routePoints.slice(0, Math.max(2, Math.ceil(routePoints.length * progressAnimated))) : routePoints;
  const mapBg = dark ? "#202124" : "#F5F5F3";
  const zone = dark ? "#292A2D" : "#EAEAE7";
  const minor = dark ? "#3C4043" : "#DADCE0";
  const corridor = dark ? "#303134" : "#FFFFFF";
  const corridorEdge = dark ? "#5F6368" : "#C9CDD1";
  const text = dark ? "#E1E4E8" : "#3C4043";
  const blue = dark ? "#8AB4F8" : "#1A73E8";
  const red = "#EA4335";
  const halo = confidence === "low" ? 28 : confidence === "medium" ? 21 : 16;

  return <Svg width="100%" height="100%" viewBox={`0 0 ${floor.bounds.width} ${floor.bounds.height}`}>
    <Rect width={floor.bounds.width} height={floor.bounds.height} fill={mapBg} />

    {(floor.contextZones ?? []).map((area, i) =>
      <Polygon key={`zone-${i}`} points={points(area)} fill={zone} stroke={minor} strokeWidth="1" />)}

    {/* Abstract navigation network: casing first, then walkable center. */}
    {(floor.corridorPaths ?? []).map((path, i) => <G key={`path-${i}`}>
      <Polyline points={points(path)} fill="none" stroke={corridorEdge} strokeWidth={i < 2 ? "27" : "20"} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={points(path)} fill="none" stroke={corridor} strokeWidth={i < 2 ? "23" : "16"} strokeLinecap="round" strokeLinejoin="round" />
      {path.slice(1, -1).map((node, n) => <Circle key={n} cx={node.x} cy={node.y} r="3" fill={minor} />)}
    </G>)}

    {floor.labels.map(label => <SvgText key={label.id} x={label.point.x} y={label.point.y}
      fill={text} fontFamily="system-ui, -apple-system, sans-serif" fontSize={label.prominent ? 13 : 11} fontWeight={label.prominent ? "600" : "500"}
      textAnchor="middle">{label.text}</SvgText>)}

    {floor.facilities.map(f => <G key={f.id}>
      <Circle cx={f.point.x} cy={f.point.y} r="10" fill={dark ? "#303134" : "#FFFFFF"} stroke={minor} />
      <SvgText x={f.point.x} y={f.point.y + 3} fill={f.kind === "information" ? blue : text}
        fontFamily="system-ui, -apple-system, sans-serif" fontSize="8" fontWeight="700" textAnchor="middle">{glyphs[f.kind] ?? "•"}</SvgText>
    </G>)}

    {showClosure && floor.closure && <G><Circle cx={floor.closure.x} cy={floor.closure.y} r="10" fill={red} />
      <Line x1={floor.closure.x - 4} y1={floor.closure.y} x2={floor.closure.x + 4} y2={floor.closure.y} stroke="#fff" strokeWidth="2" /></G>}

    {visible.length > 1 && <G>
      <Polyline points={points(visible)} fill="none" stroke={dark ? "#202124" : "#FFFFFF"} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={points(visible)} fill="none" stroke={blue} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>}

    {route?.transitionAt && <G>
      <Circle cx={route.transitionAt.x} cy={route.transitionAt.y} r="13" fill="#FFFFFF" stroke={blue} strokeWidth="2" />
      <SvgText x={route.transitionAt.x} y={route.transitionAt.y + 3} fill={blue} fontSize="8" fontWeight="700" textAnchor="middle">L{route.transitionToLevel}</SvgText>
    </G>}

    {showRouteMarkers && floor.level === 2 && destinationPoint && <G>
      <Path d={`M${destinationPoint.x} ${destinationPoint.y + 8} C${destinationPoint.x - 15} ${destinationPoint.y - 8} ${destinationPoint.x - 11} ${destinationPoint.y - 25} ${destinationPoint.x} ${destinationPoint.y - 25} C${destinationPoint.x + 11} ${destinationPoint.y - 25} ${destinationPoint.x + 15} ${destinationPoint.y - 8} ${destinationPoint.x} ${destinationPoint.y + 8}Z`} fill={red} stroke="#fff" strokeWidth="2" />
      <Circle cx={destinationPoint.x} cy={destinationPoint.y - 14} r="4" fill="#fff" />
    </G>}

    <G>
      <Circle cx={position.x} cy={position.y} r={halo} fill={blue} opacity="0.16" />
      <Circle cx={position.x} cy={position.y} r={selected ? 9 : 7} fill={blue} stroke="#FFFFFF" strokeWidth="3" />
      {selected && <Circle cx={position.x} cy={position.y} r="15" fill="none" stroke={blue} strokeWidth="2" />}
    </G>
  </Svg>;
}
