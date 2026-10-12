import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export type IconName =
  | "map"
  | "compass"
  | "settings"
  | "search"
  | "arrow"
  | "back"
  | "close"
  | "pin"
  | "shop"
  | "coffee"
  | "info"
  | "lift"
  | "accessibility"
  | "check"
  | "moon"
  | "layers"
  | "locate"
  | "restroom"
  | "parking"
  | "route";
const paths: Record<IconName, string> = {
  map: "M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5z M9 3v16 M15 5v16",
  compass: "M16 8l-3 5-5 3 3-5 5-3z",
  settings: "M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6",
  search: "M16 16l5 5",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  back: "M19 12H5 M11 6l-6 6 6 6",
  close: "M6 6l12 12 M6 18L18 6",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1114 0z M12 7v6 M9 10h6",
  shop: "M5 8h14l2 13H3L5 8z M8 8V6a4 4 0 018 0v2",
  coffee:
    "M4 8h12v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8z M16 9h2a3 3 0 010 6h-2 M7 3v2 M12 3v2",
  info: "M12 10v7 M12 7h.01",
  lift: "M5 3h14v18H5V3z M9 9l3-3 3 3 M9 15l3 3 3-3",
  accessibility: "M12 7v5l4 1 3 5 M8 10a6 6 0 107 9 M12 10h5",
  check: "M5 12l4 4L19 6",
  moon: "M20 15A9 9 0 019 3a9 9 0 1011 12z",
  layers: "M12 3l10 5-10 5L2 8l10-5z M2 12l10 5 10-5 M2 16l10 5 10-5",
  locate: "M12 2v4 M12 18v4 M2 12h4 M18 12h4",
  restroom: "M8 10v11 M5 11V7h6v4 M16 10v11 M13 11V7h6v4",
  parking: "M8 21V3h6a5 5 0 010 10H8",
  route: "M5 19V9a4 4 0 014-4h10 M15 1l4 4-4 4",
};
export function Icon({
  name,
  color = "#172B4D",
  size = 22,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {["compass", "info"].includes(name) && (
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7" />
      )}
      {name === "search" && (
        <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.7" />
      )}
      {name === "locate" && (
        <>
          <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.7" />
          <Circle cx="12" cy="12" r="2" fill={color} />
        </>
      )}
      {name === "accessibility" && (
        <Circle cx="12" cy="4" r="2" stroke={color} strokeWidth="1.7" />
      )}
      {name === "restroom" && (
        <>
          <Circle cx="8" cy="3" r="1.5" fill={color} />
          <Circle cx="16" cy="3" r="1.5" fill={color} />
        </>
      )}
      <Path
        d={paths[name]}
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
