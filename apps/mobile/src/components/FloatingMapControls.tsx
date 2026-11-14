import React from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { shadows, Theme } from "../theme";
import { atlasSandtonVenue } from "../fixtures";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { CameraMode } from "../map/camera";
import { GlassSurface } from "./GlassSurface";
import { Icon } from "./Icon";
import { MotionPressable } from "./Motion";
import { radius, space, textSize } from "../theme";

type Props = {
  theme: Theme;
  floorLevel: number;
  onSelectFloor: (level: number) => void;
  onRecenter: () => void;
  navigating: boolean;
  previewing: boolean;
  sheetHeight: number;
  liveSheetHeight?: SharedValue<number>;
  cameraMode: CameraMode;
  controlsTop: number;
};

export function FloatingMapControls({
  theme,
  floorLevel,
  onSelectFloor,
  onRecenter,
  navigating,
  previewing,
  cameraMode,
  controlsTop,
  sheetHeight,
  liveSheetHeight,
}: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const available =
    height - insets.top - insets.bottom - sheetHeight - controlsTop;
  const following = cameraMode === "follow";
  const showFollowLabel = navigating && !following;
  const floating = useAnimatedStyle(() => ({
    transform: [
      { translateY: sheetHeight - (liveSheetHeight?.value ?? sheetHeight) },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: sheetHeight + 12 }, floating]}
    >
      {atlasSandtonVenue.floors.length > 1 && (
        <View
          style={[
            styles.floors,
            available < 280 && styles.floorRow,
            shadows.soft,
            { backgroundColor: theme.paper, borderColor: theme.line },
          ]}
        >
          {[...atlasSandtonVenue.floors].reverse().map((floor) => (
            <MotionPressable
              key={floor.id}
              accessibilityRole="button"
              accessibilityLabel={`Show ${floor.name}`}
              accessibilityState={{ selected: floorLevel === floor.level }}
              onPress={() => onSelectFloor(floor.level)}
              style={[
                styles.control,
                {
                  backgroundColor:
                    floorLevel === floor.level ? theme.accentSoft : theme.paper,
                },
              ]}
            >
              <Text
                style={[
                  styles.floorLabel,
                  {
                    color:
                      floorLevel === floor.level ? theme.accent : theme.muted,
                  },
                ]}
              >
                {floor.shortLabel}
              </Text>
            </MotionPressable>
          ))}
        </View>
      )}
      <GlassSurface theme={theme} style={styles.recenter}>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={
            navigating
              ? "Recenter on demo walk"
              : previewing
                ? "Fit walking route"
                : "Show demo start"
          }
          accessibilityState={{
            selected: following || (previewing && cameraMode === "route"),
          }}
          onPress={onRecenter}
          style={({ pressed }) => [
            styles.control,
            styles.recenter,
            showFollowLabel && styles.followButton,
            (following || pressed) && { backgroundColor: theme.accentSoft },
          ]}
        >
          <Icon
            name={previewing ? "fit" : "locate"}
            color={following ? theme.accent : theme.ink}
            size={22}
          />
          {showFollowLabel && (
            <Text style={[styles.followLabel, { color: theme.ink }]}>
              Follow route
            </Text>
          )}
        </MotionPressable>
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", right: 16, alignItems: "flex-end", gap: space.sm },
  floors: {
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    padding: space.xs,
    alignItems: "center",
  },
  floorRow: { flexDirection: "row" },
  control: {
    width: 48,
    minHeight: 48,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  floorLabel: { fontSize: textSize.subhead, fontWeight: "700" },
  recenter: { borderRadius: radius.pill },
  followButton: {
    width: "auto",
    flexDirection: "row",
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  followLabel: { fontSize: textSize.footnote, fontWeight: "700" },
});
