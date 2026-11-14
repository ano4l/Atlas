// Renders the real MapCanvas component to a static HTML page, so the map's
// look can be reviewed in a desktop browser without a device.
//
//   node scripts/preview-map.cjs <out.html> [light|dark] [home|preview|walk]
//
// React Native, react-native-svg and Reanimated are replaced with small DOM
// stand-ins. Layout is close to the device, not identical: use it to judge
// colour, hierarchy and labels, not exact spacing.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

for (const extension of [".ts", ".tsx"])
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    });
    module._compile(outputText, filename);
  };

const px = (value) => (typeof value === "number" ? `${value}px` : value);
const flatten = (style) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map(flatten))
    : style && typeof style === "object"
      ? style
      : {};
function css(style, base) {
  const input = flatten(style);
  const out = { ...base };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (key === "transform") {
      out.transform = value
        .map((entry) => {
          const [name, amount] = Object.entries(entry)[0];
          return /translate/.test(name)
            ? `${name}(${px(amount)})`
            : `${name}(${amount})`;
        })
        .join(" ");
    } else if (key === "transformOrigin") {
      out.transformOrigin = Array.isArray(value)
        ? value.slice(0, 2).map(px).join(" ")
        : value;
    } else if (key === "lineHeight") out.lineHeight = px(value);
    else if (key === "shadowColor" || key === "elevation") continue;
    else if (key === "shadowOpacity")
      out.boxShadow = `0 ${input.shadowOffset?.height ?? 0}px ${(input.shadowRadius ?? 0) * 2}px rgba(11,37,64,${value})`;
    else if (/^shadow|^borderCurve$|^textShadowOffset$/.test(key)) continue;
    else if (key === "textShadowRadius")
      out.textShadow = `0 0 ${value}px ${input.textShadowColor}, 0 0 ${value}px ${input.textShadowColor}, 0 0 ${value}px ${input.textShadowColor}`;
    else if (key === "textShadowColor") continue;
    else if (key === "fontFamily")
      out.fontFamily = value === "ui-rounded" ? "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui" : value;
    else if (/^(padding|margin)Horizontal$/.test(key)) {
      const side = key.replace("Horizontal", "");
      out[side + "Left"] ??= value;
      out[side + "Right"] ??= value;
    } else if (/^(padding|margin)Vertical$/.test(key)) {
      const side = key.replace("Vertical", "");
      out[side + "Top"] ??= value;
      out[side + "Bottom"] ??= value;
    } else if (key === "flex" && typeof value === "number")
      out.flex = `${value} ${value} 0%`;
    else if (key === "fontVariant") out.fontVariantNumeric = value.join(" ");
    else out[key] = value;
  }
  if (out.borderWidth !== undefined && !out.borderStyle) out.borderStyle = "solid";
  return out;
}
const viewBase = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxSizing: "border-box",
  flexShrink: 0,
  minWidth: 0,
  minHeight: 0,
};
const View = ({ style, children }) =>
  React.createElement("div", { style: css(style, viewBase) }, children);
const InText = React.createContext(false);
const Text = ({ style, numberOfLines, children }) => {
  const nested = React.useContext(InText);
  return React.createElement(
    nested ? "span" : "div",
    {
      style: css(
        style,
        nested
          ? {}
          : {
              fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
              minWidth: 0,
              ...(numberOfLines === 1
                ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
                : {}),
            },
      ),
    },
    React.createElement(InText.Provider, { value: true }, children),
  );
};
const reactNative = {
  View,
  Text,
  Platform: { OS: "ios", select: (options) => options.ios ?? options.default },
  StyleSheet: {
    create: (styles) => styles,
    flatten,
    hairlineWidth: 0.5,
    absoluteFill: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  },
};

const svgTag = (tag) =>
  function SvgElement({ accessible, accessibilityElementsHidden, importantForAccessibility, pointerEvents, style, strokeDasharray, children, ...props }) {
    return React.createElement(
      tag,
      {
        ...props,
        ...(strokeDasharray
          ? { strokeDasharray: [].concat(strokeDasharray).join(" ") }
          : {}),
        ...(tag === "svg" ? { style: css(style, { display: "block", flexShrink: 0 }) } : {}),
      },
      children,
    );
  };
const svg = { __esModule: true, default: svgTag("svg") };
for (const [name, tag] of Object.entries({
  Circle: "circle", Ellipse: "ellipse", G: "g", Line: "line", Path: "path",
  Polygon: "polygon", Polyline: "polyline", Rect: "rect", Text: "text", Defs: "defs",
}))
  svg[name] = svgTag(tag);

const passthrough = (value) => value;
const reanimated = {
  __esModule: true,
  default: { View, createAnimatedComponent: passthrough },
  Easing: new Proxy({}, { get: () => () => passthrough }),
  useSharedValue: (value) => ({ value }),
  useAnimatedStyle: (worklet) => worklet(),
  withTiming: passthrough,
  withSpring: passthrough,
  withRepeat: passthrough,
  withDelay: (_, value) => value,
};

// Screen chrome: the sheet is drawn at one fixed detent and glass as a
// translucent blur, which is enough to judge hierarchy and colour.
const bodyHeight = { value: 96 };
const Surface = ({ theme, variant, style, children }) =>
  React.createElement(
    "div",
    {
      style: css(style, {
        ...viewBase,
        borderRadius: 28,
        background:
          variant === "chrome"
            ? "rgba(14,34,54,0.8)"
            : theme.isDark
              ? "rgba(22,33,43,0.7)"
              : "rgba(255,255,255,0.68)",
        backdropFilter: "blur(18px) saturate(1.8)",
        border: `0.5px solid ${variant === "chrome" ? "rgba(205,224,255,0.2)" : theme.line}`,
        boxShadow: "0 10px 40px rgba(11,37,64,0.18)",
      }),
    },
    children,
  );
const Pressable = ({ style, children }) =>
  React.createElement(View, { style: typeof style === "function" ? style({ pressed: false }) : style }, children);
const chrome = {
  "./GlassSurface": { GlassSurface: Surface },
  "./Motion": {
    MotionPressable: Pressable,
    MotionSurface: View,
    FeedbackContext: React.createContext({ reducedMotion: true, haptics: false }),
    useFeedback: () => () => {},
  },
  "./RouteStepsSheet": { RouteStepsSheet: () => null },
  "./DetentSheet": {
    DetentSheet: ({ theme, header, footer, children }) =>
      React.createElement(
        View,
        { style: { position: "absolute", left: 10, right: 10, bottom: 8 } },
        React.createElement(
          Surface,
          { theme, style: { borderRadius: 32 } },
          React.createElement(
            View,
            { style: { height: 22, alignItems: "center", justifyContent: "center" } },
            React.createElement(View, { style: { width: 38, height: 5, borderRadius: 3, opacity: 0.32, backgroundColor: theme.muted } }),
          ),
          header,
          React.createElement(View, { style: { height: bodyHeight.value, overflow: "hidden" } }, children),
          footer,
        ),
      ),
  },
};
reanimated.useAnimatedReaction = () => {};

const stand_ins = {
  "react-native": reactNative,
  "react-native-svg": svg,
  "react-native-reanimated": reanimated,
  ...chrome,
};
const load = Module._load;
Module._load = function (request, ...rest) {
  return stand_ins[request] ?? load.call(this, request, ...rest);
};

const [out, mode = "light", scene = "home"] = process.argv.slice(2);
if (!out) throw new Error("Usage: node scripts/preview-map.cjs <out.html> [light|dark] [home|preview|walk]");
const root = path.resolve(__dirname, "../src");
const { MapCanvas } = require(path.join(root, "components/MapCanvas.tsx"));
const { lightTheme, darkTheme } = require(path.join(root, "theme.ts"));
const { atlasSandtonVenue, samplePOIs } = require(path.join(root, "fixtures.ts"));
const { buildDemoRoute } = require(path.join(root, "map/demo-routing.ts"));
const { fitCamera } = require(path.join(root, "map/viewport.ts"));

const theme = mode === "dark" ? darkTheme : lightTheme;
const floor = atlasSandtonVenue.floors[0];
const destination = scene.startsWith("home") ? null : samplePOIs.find((poi) => poi.id === "edgars");
const route = destination ? buildDemoRoute(destination, false) : null;
const segments = route ? route.segments.filter((segment) => segment.floorLevel === floor.level) : [];
const screen = { width: 393, height: 852 };
const walking = scene === "walk";
const line = segments[0]?.polyline ?? [];
const position = walking ? { x: (line[1].x + line[2].x) / 2, y: (line[1].y + line[2].y) / 2 } : atlasSandtonVenue.start;
const focus = walking
  ? [{ x: position.x - 190, y: position.y - 200 }, { x: position.x + 190, y: position.y + 120 }]
  : destination
    ? [...line, ...floor.rooms.find((room) => room.id === destination.id).points]
    : [...floor.plate, ...(floor.contextLabels ?? []).map((label) => label.point)];
const camera = fitCamera(focus, { ...screen, top: 130, bottom: scene.startsWith("home") ? 300 : 340, right: 24 });
const zoom = Math.pow(2, Math.round(Math.log2(camera.scale) * 4) / 4);

const map = React.createElement(MapCanvas, {
  floor,
  routes: segments,
  theme,
  places: samplePOIs,
  destination,
  scale: { value: camera.scale },
  zoom,
  positionX: { value: position.x },
  positionY: { value: position.y },
  showPosition: true,
  position,
  nextPoint: walking ? line[2] : undefined,
  navigating: walking,
  reducedMotion: true,
  arrived: false,
  showUnitLabels: camera.scale >= 1.06,
});
const noop = () => {};
const screenRoot = path.join(root, "components");
let overlay = null;
if (scene === "home" || scene === "home-full") {
  const { MapHomeSheet } = require(path.join(screenRoot, "MapHomeSheet.tsx"));
  bodyHeight.value = scene === "home" ? 92 : 520;
  overlay = React.createElement(MapHomeSheet, {
    theme, savedIds: ["clicks"], recentIds: ["woolworths"], onSelect: noop, onSearch: noop,
    onBrowse: noop, onExplore: noop, onSaved: noop, onHeightChange: noop, liveSheetHeight: { value: 0 },
  });
} else if (scene === "preview") {
  const { DestinationSheet } = require(path.join(screenRoot, "DestinationSheet.tsx"));
  bodyHeight.value = 156;
  overlay = React.createElement(DestinationSheet, {
    theme, poi: destination, route, stepFree: false, arrived: false, saved: false, storageIssue: false,
    onToggleSaved: noop, onHeightChange: noop, onStartNavigation: noop, onClose: noop, onToggleStepFree: noop,
  });
} else if (scene === "walk") {
  const { ActiveNavigationPanel } = require(path.join(screenRoot, "ActiveNavigationPanel.tsx"));
  overlay = React.createElement(ActiveNavigationPanel, {
    theme, destination, route, currentStepIndex: 1, onNextStep: noop, onStopNavigation: noop,
    onHeightChange: noop, onInstructionHeightChange: noop, onOverview: noop, onFollow: noop,
    following: true, walking: true, legProgress: 0.5, onToggleWalking: noop,
  });
}
const safe = { top: 59, bottom: 34 };
const html = `<!doctype html><meta charset="utf-8"><title>Atlas map preview</title>
<body style="margin:0;background:#1b1f24">
<div style="width:${screen.width}px;height:${screen.height}px;overflow:hidden;position:relative;background:${theme.mapBg}">
<div style="position:absolute;left:0;top:0;transform-origin:0 0;transform:translate(${camera.x}px,${camera.y}px) scale(${camera.scale})">
${renderToStaticMarkup(map)}
</div>
<div style="position:absolute;left:0;right:0;top:${safe.top}px;bottom:${safe.bottom}px">${overlay ? renderToStaticMarkup(overlay) : ""}</div>
</div></body>`;
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${mode}, ${scene}, scale ${camera.scale.toFixed(2)})`);
