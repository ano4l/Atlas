import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { radius, shadows, space, Theme } from "../theme";
import { POIItem } from "../map/types";

type Props = {
  theme: Theme;
  poi: POIItem;
  onStartNavigation: () => void;
  onClose: () => void;
};

export function DestinationSheet({
  theme,
  poi,
  onStartNavigation,
  onClose,
}: Props) {
  const { height } = useWindowDimensions();
  const dark = theme.isDark;

  return (
    <View style={styles.sheetOverlay} pointerEvents="box-none">
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: dark
              ? "rgba(30, 32, 36, 0.96)"
              : "rgba(255, 255, 255, 0.96)",
            borderColor: theme.cardBorder,
            maxHeight: height * 0.36,
          },
          shadows.strong,
        ]}
      >
        {/* Handle Bar */}
        <View style={styles.handleWrapper}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
        </View>

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Row: Category Badge & Close Button */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: dark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5" },
              ]}
            >
              <Text style={[styles.statusText, { color: theme.emerald }]}>
                ● {poi.openingStatus}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close destination sheet"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#F2F1EC",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.closeIcon, { color: theme.ink }]}>✕</Text>
            </Pressable>
          </View>

          {/* Destination Name & Floor */}
          <Text style={[styles.title, { color: theme.ink }]}>{poi.name}</Text>
          <Text style={[styles.categorySubtitle, { color: theme.inkSecondary }]}>
            {poi.category} • {poi.floorName}
          </Text>

          {/* Quick Metrics Grid (Walking time, Distance, Entrance) */}
          <View
            style={[
              styles.metricsCard,
              {
                backgroundColor: dark ? "rgba(255,255,255,0.04)" : "#FAFAF7",
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.ink }]}>
                {poi.walkTimeMin} min
              </Text>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>
                Walk time
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: theme.line }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.ink }]}>
                {poi.distanceM} m
              </Text>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>
                Distance
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: theme.line }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.ink }]}>
                {poi.accessible ? "Step-free" : "Standard"}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>
                {poi.accessible ? "Accessible" : "Route"}
              </Text>
            </View>
          </View>

          {/* Entrance Information */}
          <Text style={[styles.entranceText, { color: theme.muted }]}>
            Entrance · {poi.entranceInfo}
          </Text>

          {/* Strong Black Start Navigation CTA Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Start navigation to ${poi.name}`}
            onPress={onStartNavigation}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text style={[styles.ctaText, { color: theme.primaryText }]}>
              Start navigation
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 92,
    zIndex: 22,
  },
  sheet: {
    marginHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    paddingBottom: 14,
  },
  handleWrapper: {
    alignItems: "center",
    paddingVertical: 7,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  categorySubtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: -6,
  },
  metricsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 10,
    marginVertical: 4,
  },
  metricItem: {
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  entranceText: {
    fontSize: 13,
    fontWeight: "500",
  },
  ctaButton: {
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
