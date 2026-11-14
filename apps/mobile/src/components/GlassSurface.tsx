import React, { useContext, useSyncExternalStore } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Theme, shadows } from "../theme";
import { FeedbackContext } from "./Motion";

type Material = "standard" | "opaque" | "contrast";
type Props = ViewProps & { theme: Theme; variant?: "control" | "panel" };

let material: Material = "opaque";
let stopWatching: (() => void) | undefined;
const listeners = new Set<() => void>();
const getMaterial = () => material;

async function readMaterial(): Promise<Material> {
  if (Platform.OS === "android") {
    return (await AccessibilityInfo.isHighTextContrastEnabled())
      ? "contrast"
      : "standard";
  }
  const [contrast, opaque] = await Promise.all([
    AccessibilityInfo.isDarkerSystemColorsEnabled(),
    AccessibilityInfo.isReduceTransparencyEnabled(),
  ]);
  return contrast ? "contrast" : opaque ? "opaque" : "standard";
}

function watchMaterial() {
  let revision = 0;
  const refresh = () => {
    const request = ++revision;
    void readMaterial()
      .then((next) => {
        if (request !== revision || next === material) return;
        material = next;
        listeners.forEach((listener) => listener());
      })
      .catch(() => {});
  };
  const events =
    Platform.OS === "ios"
      ? (["darkerSystemColorsChanged", "reduceTransparencyChanged"] as const)
      : (["highTextContrastChanged"] as const);
  const subscriptions = events.map((event) =>
    AccessibilityInfo.addEventListener(event, refresh),
  );
  refresh();
  return () => {
    revision++;
    subscriptions.forEach((subscription) => subscription.remove());
  };
}

function subscribe(listener: () => void) {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return () => {};
  listeners.add(listener);
  stopWatching ??= watchMaterial();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopWatching?.();
      stopWatching = undefined;
      material = "opaque";
    }
  };
}

function nativeGlassAvailable() {
  if (Platform.OS !== "ios") return false;
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

/** Raised material for map controls and menus. The native effect sits behind content. */
export function GlassSurface({
  theme,
  variant = "control",
  style,
  children,
  ...props
}: Props) {
  const systemMaterial = useSyncExternalStore(
    subscribe,
    getMaterial,
    () => "opaque",
  );
  const { reducedMotion } = useContext(FeedbackContext);
  const panel = variant === "panel";
  const glass =
    !reducedMotion && systemMaterial === "standard" && nativeGlassAvailable();
  const solid = reducedMotion || systemMaterial !== "standard" || panel;
  const radius = panel ? 28 : 24;
  const corners = StyleSheet.flatten(style);
  const outline = systemMaterial === "contrast" ? theme.muted : theme.line;

  return (
    <View
      {...props}
      style={[
        panel ? shadows.strong : shadows.soft,
        styles.surface,
        {
          borderRadius: radius,
          borderColor: outline,
          borderTopColor:
            systemMaterial === "standard" && !reducedMotion
              ? theme.isDark
                ? "rgba(205,224,255,0.22)"
                : theme.paper
              : outline,
          backgroundColor: glass
            ? "transparent"
            : solid
              ? theme.paper
              : theme.paperTranslucent,
        },
        style,
      ]}
    >
      {glass && (
        <GlassView
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          glassEffectStyle="regular"
          colorScheme={theme.isDark ? "dark" : "light"}
          tintColor={
            panel
              ? theme.isDark
                ? "rgba(27,45,58,0.32)"
                : "rgba(255,255,255,0.38)"
              : undefined
          }
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: corners?.borderRadius ?? radius,
              borderTopLeftRadius: corners?.borderTopLeftRadius,
              borderTopRightRadius: corners?.borderTopRightRadius,
              borderBottomLeftRadius: corners?.borderBottomLeftRadius,
              borderBottomRightRadius: corners?.borderBottomRightRadius,
            },
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: StyleSheet.hairlineWidth, borderCurve: "continuous" },
});
