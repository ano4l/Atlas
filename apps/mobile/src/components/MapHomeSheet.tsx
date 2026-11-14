import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { samplePOIs } from "../fixtures";
import { POIItem } from "../map/types";
import { radius, space, textSize, Theme } from "../theme";
import { Detent, DetentSheet } from "./DetentSheet";
import { Icon } from "./Icon";
import { MotionPressable } from "./Motion";
import { PlaceBadge } from "./PlaceBadge";

export function MapHomeSheet({
  theme,
  savedIds,
  recentIds,
  onSelect,
  onSearch,
  onExplore,
  onSaved,
  onHeightChange,
  liveSheetHeight,
}: {
  theme: Theme;
  savedIds: string[];
  recentIds: string[];
  onSelect: (poi: POIItem) => void;
  onSearch: () => void;
  onExplore: () => void;
  onSaved: () => void;
  onHeightChange: (height: number) => void;
  liveSheetHeight: SharedValue<number>;
}) {
  const [detent, setDetent] = useState<Detent>(1);
  const [shortcutsHeight, setShortcutsHeight] = useState(0);
  const stops = useMemo(
    () =>
      [
        ...new Set([
          "unit-s026",
          "unit-s068",
          "unit-s104",
          ...recentIds,
          ...savedIds,
          "woolworths",
          "checkers",
          "clicks",
          "edgars",
          "mr-price",
        ]),
      ]
        .map((id) => samplePOIs.find((poi) => poi.id === id))
        .filter((poi): poi is POIItem => !!poi)
        .slice(0, 5),
    [recentIds, savedIds],
  );
  const listShown = detent === 2;

  return (
    <DetentSheet
      theme={theme}
      label="suggested places"
      mediumHeight={shortcutsHeight}
      onDetentChange={setDetent}
      onHeightChange={onHeightChange}
      liveHeight={liveSheetHeight}
      header={
        <MotionPressable
          accessibilityRole="button"
          onPress={onSearch}
          style={({ pressed }) => [
            styles.search,
            {
              backgroundColor: pressed ? theme.accentSoft : theme.subtle,
              borderColor: theme.line,
            },
          ]}
        >
          <Icon name="search" color={theme.accent} size={22} />
          <Text style={[styles.searchLabel, { color: theme.ink }]}>
            Search stores and units
          </Text>
        </MotionPressable>
      }
    >
      {/* The middle detent ends exactly below these shortcuts. */}
      <View
        onLayout={(event) => setShortcutsHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.discovery}>
          <Text style={[styles.discoveryTitle, { color: theme.ink }]}>
            Explore the demo
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.discoveryRow}
          >
            {stops.map((poi) => (
              <MotionPressable
                key={poi.id}
                accessibilityRole="button"
                accessibilityLabel={`Preview ${poi.name}`}
                onPress={() => onSelect(poi)}
                style={({ pressed }) => [
                  styles.discoveryCard,
                  {
                    backgroundColor: pressed ? theme.accentSoft : theme.subtle,
                    borderColor: theme.line,
                  },
                ]}
              >
                <PlaceBadge poi={poi} theme={theme} size={32} />
                <View style={styles.placeCopy}>
                  <Text
                    numberOfLines={1}
                    style={[styles.name, { color: theme.ink }]}
                  >
                    {poi.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.caption, { color: theme.muted }]}
                  >
                    {poi.demo ? "Demo / " : ""}
                    {poi.category}
                  </Text>
                </View>
                <Icon name="chevron-right" color={theme.muted} size={14} />
              </MotionPressable>
            ))}
          </ScrollView>
        </View>
        <View style={styles.actions}>
          <MotionPressable
            accessibilityRole="button"
            onPress={onExplore}
            style={({ pressed }) => [
              styles.action,
              pressed && { backgroundColor: theme.subtle },
            ]}
          >
            <Icon name="layers" color={theme.inkSecondary} size={17} />
            <Text style={[styles.actionLabel, { color: theme.inkSecondary }]}>
              Directory
            </Text>
          </MotionPressable>
          <View style={[styles.divider, { backgroundColor: theme.line }]} />
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={
              savedIds.length
                ? `Saved places, ${savedIds.length}`
                : "Saved places"
            }
            onPress={onSaved}
            style={({ pressed }) => [
              styles.action,
              pressed && { backgroundColor: theme.subtle },
            ]}
          >
            <Icon name="bookmark" color={theme.inkSecondary} size={17} />
            <Text style={[styles.actionLabel, { color: theme.inkSecondary }]}>
              Saved
            </Text>
          </MotionPressable>
        </View>
      </View>
      <View
        pointerEvents={listShown ? "auto" : "none"}
        accessibilityElementsHidden={!listShown}
        importantForAccessibility={listShown ? "auto" : "no-hide-descendants"}
        style={styles.list}
      >
        <Text
          accessibilityRole="header"
          style={[styles.listHeading, { color: theme.ink }]}
        >
          Suggested places
        </Text>
        {stops.map((poi, index) => (
          <MotionPressable
            key={poi.id}
            accessibilityRole="button"
            accessibilityLabel={`Preview ${poi.name}`}
            onPress={() => onSelect(poi)}
            style={({ pressed }) => [
              styles.listItem,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderColor: theme.line,
              },
              pressed && { backgroundColor: theme.accentSoft },
            ]}
          >
            <PlaceBadge poi={poi} theme={theme} size={38} />
            <View style={styles.placeCopy}>
              <Text style={[styles.name, { color: theme.ink }]}>
                {poi.name}
              </Text>
              <Text style={[styles.caption, { color: theme.muted }]}>
                {recentIds.includes(poi.id)
                  ? "Recently viewed"
                  : savedIds.includes(poi.id)
                    ? "Saved place"
                    : poi.category}
              </Text>
            </View>
            <Icon name="chevron-right" color={theme.muted} size={17} />
          </MotionPressable>
        ))}
      </View>
    </DetentSheet>
  );
}

const styles = StyleSheet.create({
  search: {
    marginHorizontal: space.md,
    marginBottom: space.md,
    minHeight: 54,
    borderRadius: radius.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  searchLabel: {
    flex: 1,
    fontSize: textSize.body,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  discovery: { gap: space.sm },
  discoveryTitle: { paddingHorizontal: space.lg, fontSize: textSize.footnote, fontWeight: "600" },
  discoveryRow: { paddingHorizontal: space.md, gap: space.sm, paddingBottom: space.sm },
  discoveryCard: {
    width: 210,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingBottom: space.xs,
    paddingTop: space.xxs,
  },
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    paddingVertical: space.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  actionLabel: { fontSize: textSize.subhead, fontWeight: "600" },
  divider: { height: 18, width: StyleSheet.hairlineWidth },
  list: { paddingHorizontal: space.lg, paddingBottom: space.md },
  listHeading: {
    fontSize: textSize.body,
    fontWeight: "700",
    paddingVertical: space.sm,
    paddingTop: space.md,
  },
  listItem: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.sm,
  },
  placeCopy: { flex: 1, gap: space.xs },
  name: { fontSize: textSize.subhead, fontWeight: "600" },
  caption: { fontSize: textSize.footnote },
});
