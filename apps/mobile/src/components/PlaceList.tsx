import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { samplePOIs } from "../fixtures";
import { POIItem } from "../map/types";
import { floorName } from "../map/demo-routing";
import { Theme } from "../theme";
import { Icon, IconName } from "./Icon";

export const categories: { id: string; label: string; icon: IconName }[] = [
  { id: "all", label: "All places", icon: "compass" },
  { id: "fashion", label: "Shopping", icon: "shop" },
  { id: "food", label: "Food & coffee", icon: "coffee" },
  { id: "services", label: "Facilities", icon: "info" },
];
export const placeIcon = (poi: POIItem): IconName =>
  poi.category.includes("Entertainment")
    ? "compass"
    : poi.category.includes("Dining")
      ? "coffee"
      : poi.category.includes("Restrooms")
        ? "restroom"
        : poi.category.includes("Guest")
          ? "info"
          : "shop";
export function filterPlaces(query: string, category: string) {
  const text = query.trim().toLowerCase();
  return samplePOIs.filter(
    (p) =>
      `${p.name} ${p.category} ${p.description ?? ""}`
        .toLowerCase()
        .includes(text) &&
      (category === "all" ||
        (category === "fashion" && placeIcon(p) === "shop") ||
        (category === "food" && placeIcon(p) === "coffee") ||
        (category === "services" &&
          ["info", "restroom"].includes(placeIcon(p)))),
  );
}
export function CategoryPicker({
  theme,
  value,
  onChange,
}: {
  theme: Theme;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {categories.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          accessibilityState={{ selected: value === c.id }}
          onPress={() => onChange(c.id)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: value === c.id ? theme.primary : theme.paper,
              borderColor: theme.line,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Icon
            name={c.icon}
            color={value === c.id ? theme.primaryText : theme.muted}
            size={18}
          />
          <Text
            style={[
              styles.chipText,
              { color: value === c.id ? theme.primaryText : theme.ink },
            ]}
          >
            {c.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export function PlaceRow({
  theme,
  poi,
  onPress,
}: {
  theme: Theme;
  poi: POIItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Preview ${poi.name}, ${floorName(poi.floorLevel)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.subtle : theme.paper,
          borderColor: theme.line,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={placeIcon(poi)} color={theme.accent} size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.name, { color: theme.ink }]}>{poi.name}</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {floorName(poi.floorLevel)} · {poi.category}
        </Text>
        {poi.sponsored && (
          <Text style={[styles.sponsor, { color: theme.amber }]}>
            Sponsored demo listing
          </Text>
        )}
      </View>
      <Icon name="arrow" color={theme.muted} size={18} />
    </Pressable>
  );
}
export function EmptyPlaces({
  theme,
  onReset,
}: {
  theme: Theme;
  onReset: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Icon name="search" color={theme.muted} size={32} />
      <Text style={[styles.emptyTitle, { color: theme.ink }]}>
        No places found
      </Text>
      <Text style={[styles.meta, { color: theme.muted }]}>
        Try a shop name, food or restrooms.
      </Text>
      <Pressable
        onPress={onReset}
        accessibilityRole="button"
        style={styles.reset}
      >
        <Text style={{ color: theme.accent, fontSize: 16, fontWeight: "600" }}>
          Show all places
        </Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  chips: { gap: 8, paddingHorizontal: 20 },
  chip: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipText: { fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    minHeight: 88,
    borderBottomWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 16, lineHeight: 20 },
  sponsor: { fontSize: 12 },
  empty: { padding: 32, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 24, fontWeight: "600" },
  reset: { minHeight: 44, justifyContent: "center" },
});
