import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, shadows, Theme } from "../theme";

type Props = {
  theme: Theme;
  venueName?: string;
  floorLevel: number;
  onSelectFloor: (level: number) => void;
  onRecenter: () => void;
  confidence?: "high" | "medium" | "low";
  onConfidencePress?: () => void;
};

export function FloatingMapControls({
  theme,
  venueName = "Sandton City",
  floorLevel,
  onSelectFloor,
  onRecenter,
  confidence = "high",
  onConfidencePress,
}: Props) {
  const dark = theme.isDark;

  const floorLabels: Record<number, string> = {
    1: "G",
    2: "L1",
  };

  const confidenceText =
    confidence === "high"
      ? "High confidence"
      : confidence === "medium"
      ? "Approximate"
      : "Confirm location";

  const confidenceColor =
    confidence === "high"
      ? theme.emerald
      : confidence === "medium"
      ? theme.amber
      : theme.danger;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Top Venue & Confidence Badge */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${venueName}, Level ${floorLevel}. Positioning status: ${confidenceText}`}
        onPress={onConfidencePress}
        style={({ pressed }) => [
          styles.badge,
          {
            backgroundColor: dark
              ? "rgba(30,32,36,0.92)"
              : "rgba(255,255,255,0.92)",
            borderColor: theme.cardBorder,
            opacity: pressed ? 0.85 : 1,
          },
          shadows.soft,
        ]}
      >
        <View style={styles.badgeRow}>
          <Text style={[styles.venueText, { color: theme.ink }]}>
            {venueName}
          </Text>
          <Text style={[styles.dotDivider, { color: theme.muted }]}>•</Text>
          <Text style={[styles.floorText, { color: theme.inkSecondary }]}>
            {floorLevel === 1 ? "Ground Floor" : "Level 1"}
          </Text>
        </View>

        <View style={styles.confidenceRow}>
          <View
            style={[styles.confidenceDot, { backgroundColor: confidenceColor }]}
          />
          <Text style={[styles.confidenceLabel, { color: confidenceColor }]}>
            {confidenceText}
          </Text>
        </View>
      </Pressable>

      {/* Right Column Map Controls (Floor selector, Recenter, Compass) */}
      <View style={styles.controlsColumn} pointerEvents="box-none">
        {/* Compact Floor Selector Pill */}
        <View
          style={[
            styles.floorPill,
            {
              backgroundColor: dark
                ? "rgba(30,32,36,0.94)"
                : "rgba(255,255,255,0.94)",
              borderColor: theme.cardBorder,
            },
            shadows.soft,
          ]}
        >
          {[2, 1].map((level) => {
            const isSelected = level === floorLevel;
            return (
              <Pressable
                key={level}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Select Level ${level}`}
                onPress={() => onSelectFloor(level)}
                style={({ pressed }) => [
                  styles.floorButton,
                  isSelected && {
                    backgroundColor: theme.primary,
                  },
                  pressed && !isSelected && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.floorButtonText,
                    {
                      color: isSelected ? theme.primaryText : theme.inkSecondary,
                      fontWeight: isSelected ? "800" : "600",
                    },
                  ]}
                >
                  {floorLabels[level]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Recenter Location Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Recenter location"
          onPress={onRecenter}
          style={({ pressed }) => [
            styles.iconControl,
            {
              backgroundColor: dark
                ? "rgba(30,32,36,0.94)"
                : "rgba(255,255,255,0.94)",
              borderColor: theme.cardBorder,
              opacity: pressed ? 0.75 : 1,
            },
            shadows.soft,
          ]}
        >
          <View style={[styles.recenterRing, { borderColor: theme.accent }]}>
            <View style={[styles.recenterDot, { backgroundColor: theme.accent }]} />
          </View>
        </Pressable>

        {/* Compass Needle */}
        <View
          accessibilityLabel="Compass pointing North"
          style={[
            styles.iconControl,
            {
              backgroundColor: dark
                ? "rgba(30,32,36,0.94)"
                : "rgba(255,255,255,0.94)",
              borderColor: theme.cardBorder,
            },
            shadows.soft,
          ]}
        >
          <Text style={[styles.compassText, { color: theme.danger }]}>N</Text>
          <View style={[styles.compassNeedle, { borderBottomColor: theme.danger }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 122,
    left: 16,
    right: 16,
    zIndex: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  venueText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  dotDivider: {
    fontSize: 10,
  },
  floorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  controlsColumn: {
    gap: 10,
    alignItems: "flex-end",
  },
  floorPill: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  floorButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  floorButtonText: {
    fontSize: 13,
  },
  iconControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  controlIcon: {
    fontSize: 18,
  },
  recenterRing: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  recenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compassText: {
    fontSize: 10,
    fontWeight: "900",
  },
  compassNeedle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
