import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { atlasSandtonVenue } from "../fixtures";
import { POIItem } from "../map/types";
import { Theme } from "../theme";
import { Icon } from "./Icon";
import {
  categories,
  CategoryPicker,
  EmptyPlaces,
  filterPlaces,
  PlaceRow,
} from "./PlaceList";

import { MotionPressable } from "./Motion";
export function ExploreScreen({
  theme,
  onSelectPOI,
  savedIds,
  onSearch,
}: {
  theme: Theme;
  onSelectPOI: (poi: POIItem) => void;
  savedIds: string[];
  onSearch: () => void;
}) {
  const [category, setCategory] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const places = savedOnly
    ? filterPlaces("", "all").filter((place) => savedIds.includes(place.id))
    : filterPlaces("", category);
  const heading = savedOnly
    ? "Saved places"
    : (categories.find((item) => item.id === category)?.label ?? "All places");

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.scroll}
      data={places}
      keyExtractor={(item) => item.id}
      initialNumToRender={10}
      renderItem={({ item, index }) => (
        <View style={styles.listRow}>
          <PlaceRow
            theme={theme}
            poi={item}
            first={index === 0}
            last={index === places.length - 1}
            saved={!savedOnly && savedIds.includes(item.id)}
            onPress={() => onSelectPOI(item)}
          />
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.gutter}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: theme.ink }]}
            >
              Directory
            </Text>
            <View style={styles.venue}>
              <Icon name="pin" color={theme.accent} size={18} />
              <Text style={[styles.meta, { color: theme.inkSecondary }]}>
                {atlasSandtonVenue.venueName} · Indoor demo
              </Text>
            </View>
          </View>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Search stores and units"
            onPress={onSearch}
            style={({ pressed }) => [
              styles.search,
              {
                backgroundColor: pressed ? theme.subtle : theme.paper,
                borderColor: theme.line,
              },
            ]}
          >
            <Icon name="search" color={theme.accent} size={20} />
            <Text style={[styles.searchLabel, { color: theme.inkSecondary }]}>
              Search stores and units
            </Text>
            <Icon name="chevron-right" color={theme.muted} size={18} />
          </MotionPressable>
          <View style={[styles.segment, { backgroundColor: theme.subtle }]}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityState={{ selected: !savedOnly }}
              onPress={() => setSavedOnly(false)}
              style={({ pressed }) => [
                styles.segmentOption,
                !savedOnly && { backgroundColor: theme.paper },
                pressed && { opacity: 0.72 },
              ]}
            >
              <Icon
                name="map"
                color={!savedOnly ? theme.accent : theme.muted}
                size={18}
              />
              <Text
                style={[
                  styles.label,
                  { color: !savedOnly ? theme.ink : theme.muted },
                ]}
              >
                Browse
              </Text>
            </MotionPressable>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={`Saved places, ${savedIds.length}`}
              accessibilityState={{ selected: savedOnly }}
              onPress={() => setSavedOnly(true)}
              style={({ pressed }) => [
                styles.segmentOption,
                savedOnly && { backgroundColor: theme.paper },
                pressed && { opacity: 0.72 },
              ]}
            >
              <Icon
                name="bookmark"
                color={savedOnly ? theme.accent : theme.muted}
                size={18}
              />
              <Text
                style={[
                  styles.label,
                  { color: savedOnly ? theme.ink : theme.muted },
                ]}
              >
                Saved{savedIds.length > 0 ? ` · ${savedIds.length}` : ""}
              </Text>
            </MotionPressable>
          </View>
          {!savedOnly && (
            <CategoryPicker
              theme={theme}
              value={category}
              onChange={setCategory}
            />
          )}
          <View style={styles.listHeading}>
            <Text
              accessibilityRole="header"
              style={[styles.section, { color: theme.ink }]}
            >
              {heading}
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {places.length} {places.length === 1 ? "place" : "places"}
            </Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyPlaces
          theme={theme}
          icon={savedOnly ? "bookmark" : undefined}
          title={savedOnly ? "No saved places yet" : undefined}
          message={
            savedOnly
              ? "Open a place and tap its bookmark to find it here later."
              : undefined
          }
          onReset={() => {
            setSavedOnly(false);
            setCategory("all");
          }}
        />
      }
      ListFooterComponent={
        places.length > 0 ? (
          <Text style={[styles.note, { color: theme.muted }]}>
            Places and routes are based on a reference floor plan.
          </Text>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 12,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  header: { gap: 16, paddingBottom: 12 },
  gutter: { paddingHorizontal: 16, gap: 8 },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  venue: { flexDirection: "row", alignItems: "center", gap: 8 },
  meta: { fontSize: 14, lineHeight: 20, flexShrink: 1 },
  search: {
    marginHorizontal: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchLabel: { flex: 1, fontSize: 16, lineHeight: 22 },
  segment: {
    marginHorizontal: 16,
    padding: 4,
    gap: 4,
    borderRadius: 16,
    flexDirection: "row",
  },
  segmentOption: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  listHeading: {
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
  },
  section: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  listRow: { marginHorizontal: 16 },
  note: {
    marginHorizontal: 16,
    marginTop: 20,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
