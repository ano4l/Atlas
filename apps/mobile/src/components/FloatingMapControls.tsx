import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { shadows, Theme } from "../theme";
import { atlasSandtonVenue } from "../fixtures";
import { Icon } from "./Icon";
type Props = {
  theme: Theme;
  floorLevel: number;
  onSelectFloor: (level: number) => void;
  onRecenter: () => void;
  navigating?: boolean;
};
export function FloatingMapControls({
  theme,
  floorLevel,
  onSelectFloor,
  onRecenter,
  navigating,
}: Props) {
  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { top: navigating ? 132 : 144 }]}
    >
      <View style={[styles.venue, { backgroundColor: theme.paper }]}>
        <Icon name="pin" color={theme.accent} size={18} />
        <View>
          <Text style={[styles.name, { color: theme.ink }]}>Sandton City</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>
            Illustrative indoor map
          </Text>
        </View>
      </View>
      <View style={styles.controls}>
        <View
          style={[
            styles.floors,
            { backgroundColor: theme.paper, borderColor: theme.line },
            shadows.soft,
          ]}
        >
          <Icon name="layers" color={theme.muted} size={18} />
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
          accessibilityLabel="Recenter map"
          onPress={onRecenter}
          style={({ pressed }) => [
            styles.recenter,
            {
              backgroundColor: theme.paper,
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
    justifyContent: "space-between",
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
  controls: { gap: 12 },
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
