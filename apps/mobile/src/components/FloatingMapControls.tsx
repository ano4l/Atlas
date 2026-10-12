import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { shadows, Theme } from "../theme";
import { atlasSandtonVenue } from "../fixtures";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraMode } from "../map/camera";
import { floorName } from "../map/demo-routing";
import { Icon } from "./Icon";
type Props = {
  theme: Theme;
  floorLevel: number;
  onSelectFloor: (level: number) => void;
  onRecenter: () => void;
  navigating?: boolean;
  sheetHeight: number;
  hasDestination: boolean;
  cameraMode: CameraMode;
  controlsTop: number;
};
export function FloatingMapControls({
  theme,
  floorLevel,
  onSelectFloor,
  onRecenter,
  navigating,
  cameraMode,
  controlsTop,
  sheetHeight,
  hasDestination,
}: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact =
    height - insets.top - insets.bottom - 84 - sheetHeight - controlsTop < 216;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { top: controlsTop }]}
    >
      {!hasDestination && !compact && (
        <View
          style={[
            styles.venue,
            { backgroundColor: theme.paper, maxWidth: 200 },
          ]}
        >
          <Icon name="pin" color={theme.accent} size={18} />
          <View style={{ flexShrink: 1 }}>
            <Text style={[styles.name, { color: theme.ink }]}>
              Sandton City
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {floorName(floorLevel)} · Demo map
            </Text>
          </View>
        </View>
      )}
      <View style={[styles.controls, compact && { flexDirection: "row" }]}>
        <View
          style={[
            styles.floors,
            compact && { flexDirection: "row", padding: 4 },
            { backgroundColor: theme.paper, borderColor: theme.line },
            shadows.soft,
          ]}
        >
          {!compact && <Icon name="layers" color={theme.muted} size={18} />}
          {[...atlasSandtonVenue.floors].reverse().map((f) => (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityLabel={"Show " + f.name}
              accessibilityState={{ selected: floorLevel === f.level }}
              onPress={() => onSelectFloor(f.level)}
              style={({ pressed }) => [
                styles.floor,
                {
                  backgroundColor:
                    floorLevel === f.level ? theme.accentSoft : theme.paper,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.floorLabel,
                  {
                    color: floorLevel === f.level ? theme.accent : theme.muted,
                  },
                ]}
              >
                {f.shortLabel}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            navigating ? "Resume following demo position" : "Recenter map"
          }
          accessibilityState={{ selected: cameraMode === "follow" }}
          onPress={onRecenter}
          style={({ pressed }) => [
            styles.recenter,
            {
              backgroundColor:
                cameraMode === "follow" ? theme.accentSoft : theme.paper,
              borderColor: theme.line,
              opacity: pressed ? 0.7 : 1,
            },
            shadows.soft,
          ]}
        >
          <Icon name="locate" color={theme.accent} />
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
  },
  venue: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
  },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 4 },
  controls: { gap: 12, marginLeft: "auto" },
  floors: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 4,
    paddingTop: 12,
    alignItems: "center",
    gap: 4,
  },
  floor: {
    width: 44,
    minHeight: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  floorLabel: { fontSize: 16, fontWeight: "600" },
  recenter: {
    width: 52,
    height: 52,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
