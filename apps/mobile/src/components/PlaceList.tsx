import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { atlasSandtonVenue, samplePOIs } from "../fixtures";
import { POIItem } from "../map/types";
import { floorName } from "../map/demo-routing";
import { Theme } from "../theme";
import { Icon, IconName } from "./Icon";
import { PlaceBadge } from "./PlaceBadge";
export { placeIcon } from "../place-presentation";

export const categories: { id: string; label: string; icon: IconName }[] = [
  { id: "all", label: "All places", icon: "compass" },
  { id: "anchors", label: "Stores", icon: "shop" },
  { id: "units", label: "Units", icon: "layers" },
  { id: "landmarks", label: "Landmarks", icon: "pin" },
];
const searchScopes = [
  categories[0],
  { id: "saved", label: "Saved", icon: "bookmark" as const },
  ...categories.slice(1),
];

function searchWords(text: string) {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\bs[\s_\-–]+(?=\d)/g, "s")
      .match(/[a-z0-9]+/g) ?? []
  );
}

const directory = samplePOIs.map((place) => ({
  place,
  words: searchWords(
    [
      place.name,
      place.category,
      place.unitLabel,
      place.description,
      place.category === "Food Market" ? "supermarket grocery groceries" : "",
    ].join(" "),
  ),
}));

export function filterPlaces(query: string, category: string) {
  const terms = searchWords(query);
  if (query.trim() && terms.length === 0) return [];
  return directory
    .filter(({ place, words }) => {
      const isUnit = place.id.startsWith("unit-") && !place.demo;
      const isLandmark = place.category === "Map landmark";
      return (
        (category === "all" ||
          (category === "anchors" && !isUnit && !isLandmark) ||
          (category === "units" && isUnit) ||
          (category === "landmarks" && isLandmark)) &&
        terms.every((term) => words.some((word) => word.includes(term)))
      );
    })
    .map(({ place }) => place);
}

export function CategoryPicker({
  theme,
  value,
  onChange,
  includeSaved = false,
}: {
  theme: Theme;
  value: string;
  onChange: (value: string) => void;
  includeSaved?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.chips}
    >
      {(includeSaved ? searchScopes : categories).map((category) => {
        const selected = value === category.id;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(category.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.accentSoft : theme.paper,
                borderColor: selected ? theme.accentSoft : theme.line,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Icon
              name={category.icon}
              color={selected ? theme.accent : theme.muted}
              size={16}
            />
            <Text
              style={[
                styles.chipText,
                { color: selected ? theme.accent : theme.ink },
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
export function PlaceRow({
  theme,
  poi,
  onPress,
  first = false,
  last = false,
  saved = false,
}: {
  theme: Theme;
  poi: POIItem;
  onPress: () => void;
  first?: boolean;
  last?: boolean;
  saved?: boolean;
}) {
  const reference =
    poi.unitLabel && poi.name !== `Unit ${poi.unitLabel}`
      ? poi.unitLabel
      : null;
  const floor = floorName(poi.floorLevel);
  const location = [poi.category];
  if (atlasSandtonVenue.floors.length > 1) location.push(floor);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        `Preview ${poi.name}`,
        ...location,
        reference && `Demo reference ${reference}`,
        !location.includes(floor) && floor,
        saved && "Saved",
        poi.sponsored ? "Sponsored listing" : null,
      ]
        .filter(Boolean)
        .join(", ")}
      accessibilityHint="Opens this place on the map."
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.subtle : theme.paper,
          borderColor: theme.line,
        },
        first && styles.rowFirst,
        last && styles.rowLast,
      ]}
    >
      <PlaceBadge poi={poi} theme={theme} size={40} />
      <View style={styles.copy}>
        <Text style={[styles.name, { color: theme.ink }]}>{poi.name}</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {[
            ...location,
            reference && `Ref. ${reference}`,
            poi.demo && "Demo tenant",
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {poi.sponsored && (
          <Text style={[styles.meta, { color: theme.amber }]}>
            Sponsored demo listing
          </Text>
        )}
      </View>
      {saved && <Icon name="bookmark" color={theme.accent} size={16} />}
      <Icon name="chevron-right" color={theme.muted} size={16} />
      {!last && (
        <View
          pointerEvents="none"
          style={[styles.divider, { backgroundColor: theme.line }]}
        />
      )}
    </Pressable>
  );
}
export function EmptyPlaces({
  theme,
  onReset,
  icon = "search",
  title = "No places found",
  message = "Try a store name or a unit code like S003.",
  action = "Browse all places",
}: {
  theme: Theme;
  onReset: () => void;
  icon?: IconName;
  title?: string;
  message?: string;
  action?: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={icon} color={theme.accent} size={24} />
      </View>
      <Text
        accessibilityRole="header"
        style={[styles.emptyTitle, { color: theme.ink }]}
      >
        {title}
      </Text>
      <Text style={[styles.meta, styles.emptyText, { color: theme.muted }]}>
        {message}
      </Text>
      <Pressable
        onPress={onReset}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.reset,
          { backgroundColor: pressed ? theme.subtle : theme.accentSoft },
        ]}
      >
        <Text style={[styles.chipText, { color: theme.accent }]}>{action}</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  chips: { gap: 6, paddingHorizontal: 16 },
  chip: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    minHeight: 64,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  rowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  divider: {
    position: "absolute",
    bottom: 0,
    left: 64,
    right: 12,
    height: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1, gap: 2 },
  name: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  meta: { fontSize: 13, lineHeight: 18 },
  empty: { padding: 24, alignItems: "center", gap: 12 },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: { textAlign: "center" },
  reset: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
});
