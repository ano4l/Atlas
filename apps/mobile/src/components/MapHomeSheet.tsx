import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { samplePOIs } from "../fixtures";
import { POIItem } from "../map/types";
import { fonts, radius, space, textSize, Theme } from "../theme";
import { Detent, DetentSheet } from "./DetentSheet";
import { Icon } from "./Icon";
import { MotionPressable } from "./Motion";
import { PlaceBadge } from "./PlaceBadge";
import { BrowseShortcuts } from "./PlaceList";

export function MapHomeSheet({
  theme,
  savedIds,
  recentIds,
  onSelect,
  onSearch,
  onBrowse,
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
  onBrowse: (query: string) => void;
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
          ...recentIds,
          ...savedIds,
          "woolworths",
          "checkers",
          "unit-s026",
          "edgars",
          "clicks",
          "unit-s068",
          "mr-price",
        ]),
      ]
        .map((id) => samplePOIs.find((poi) => poi.id === id))
        .filter((poi): poi is POIItem => !!poi)
        .slice(0, 6),
    [recentIds, savedIds],
  );
  const listShown = detent === 2;

  return (
    <DetentSheet
      theme={theme}
      label="places"
      mediumHeight={shortcutsHeight}
      onDetentChange={setDetent}
      onHeightChange={onHeightChange}
      liveHeight={liveSheetHeight}
      header={
        <View style={styles.searchRow}>
          <MotionPressable
            accessibilityRole="search"
            accessibilityLabel="Search stores and units"
            onPress={onSearch}
            style={({ pressed }) => [
              styles.search,
              { backgroundColor: pressed ? theme.accentSoft : theme.fill },
            ]}
          >
            <Icon name="search" color={theme.muted} size={20} strokeWidth={2} />
            <Text style={[styles.searchLabel, { color: theme.muted }]}>
              Where to?
            </Text>
          </MotionPressable>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={
              savedIds.length
                ? `Saved places, ${savedIds.length}`
                : "Saved places"
            }
            onPress={onSaved}
            style={({ pressed }) => [
              styles.saved,
              { backgroundColor: pressed ? theme.accentSoft : theme.fill },
            ]}
          >
            <Icon name="bookmark" color={theme.accent} size={20} />
          </MotionPressable>
        </View>
      }
    >
      {/* The middle detent ends exactly below these shortcuts. */}
      <View
        style={styles.browse}
        onLayout={(event) => setShortcutsHeight(event.nativeEvent.layout.height)}
      >
        <BrowseShortcuts theme={theme} onBrowse={onBrowse} onAll={onExplore} />
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
          Suggested
        </Text>
        <View style={[styles.card, { backgroundColor: theme.fill }]}>
          {stops.map((poi, index) => (
            <MotionPressable
              key={poi.id}
              accessibilityRole="button"
              accessibilityLabel={`Preview ${poi.name}`}
              onPress={() => onSelect(poi)}
              style={({ pressed }) => [
                styles.listItem,
                pressed && { backgroundColor: theme.accentSoft },
              ]}
            >
              <PlaceBadge poi={poi} theme={theme} size={40} />
              <View
                style={[
                  styles.listCopy,
                  index < stops.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.line,
                  },
                ]}
              >
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
                    {recentIds.includes(poi.id)
                      ? "Recent"
                      : savedIds.includes(poi.id)
                        ? "Saved"
                        : poi.demo
                          ? `Demo · ${poi.category}`
                          : poi.category}
                  </Text>
                </View>
                <Icon name="chevron-right" color={theme.muted} size={16} />
              </View>
            </MotionPressable>
          ))}
        </View>
      </View>
    </DetentSheet>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  search: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  searchLabel: {
    flex: 1,
    fontFamily: fonts.rounded,
    fontSize: 17,
    fontWeight: "600",
  },
  saved: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  browse: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  list: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  listHeading: {
    fontFamily: fonts.rounded,
    fontSize: textSize.title,
    fontWeight: "700",
    letterSpacing: -0.3,
    paddingBottom: space.md,
  },
  card: {
    borderCurve: "continuous",
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  listItem: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingLeft: space.md,
  },
  listCopy: {
    flex: 1,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingRight: space.md,
  },
  placeCopy: { flex: 1, gap: space.xxs },
  name: { fontSize: textSize.body, fontWeight: "600", letterSpacing: -0.2 },
  caption: { fontSize: textSize.footnote },
});
