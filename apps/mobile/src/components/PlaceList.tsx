import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { atlasSandtonVenue, samplePOIs } from "../fixtures";
import { POIItem } from "../map/types";
import { floorName } from "../map/demo-routing";
import { Theme } from "../theme";
import { mapPalette, PlaceKind } from "../map/style";
import { Icon, IconName } from "./Icon";
import { PlaceBadge } from "./PlaceBadge";
import { MotionPressable } from "./Motion";
import { radius, space, textSize } from "../theme";
import { fonts } from "../theme";
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

/** Shortcuts into search. Each one runs a real query against the directory. */
export const browseShortcuts: {
  label: string;
  query: string;
  kind: PlaceKind;
  icon: IconName;
}[] = [
  { label: "Food", query: "Dining", kind: "food", icon: "cutlery" },
  { label: "Fashion", query: "Fashion", kind: "shop", icon: "shop" },
  { label: "Health", query: "Health", kind: "health", icon: "plus" },
  { label: "Tech", query: "Electronics", kind: "tech", icon: "device" },
  { label: "Home", query: "Home", kind: "home", icon: "home" },
];

/** The coloured category circles shared by the home sheet and search. */
export function BrowseShortcuts({
  theme,
  onBrowse,
  onAll,
}: {
  theme: Theme;
  onBrowse: (query: string) => void;
  /** Adds an "All" circle that opens the full directory. */
  onAll?: () => void;
}) {
  const tones = mapPalette(theme.isDark).tones;
  return (
    <View style={styles.browse}>
      {browseShortcuts.map((item) => (
        <MotionPressable
          key={item.label}
          accessibilityRole="button"
          accessibilityLabel={`Find ${item.label}`}
          onPress={() => onBrowse(item.query)}
          style={styles.browseItem}
        >
          <View
            style={[
              styles.browseIcon,
              { backgroundColor: tones[item.kind].badge },
            ]}
          >
            <Icon name={item.icon} color="#FFFFFF" size={24} strokeWidth={2} />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.browseLabel, { color: theme.inkSecondary }]}
          >
            {item.label}
          </Text>
        </MotionPressable>
      ))}
      {onAll && (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Open the full directory"
          onPress={onAll}
          style={styles.browseItem}
        >
          <View style={[styles.browseIcon, { backgroundColor: theme.chrome }]}>
            <Icon name="layers" color={theme.lime} size={24} strokeWidth={2} />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.browseLabel, { color: theme.inkSecondary }]}
          >
            All
          </Text>
        </MotionPressable>
      )}
    </View>
  );
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
          <MotionPressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(category.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.ink : theme.fill,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Icon
              name={category.icon}
              color={selected ? theme.paper : theme.inkSecondary}
              size={16}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.chipText,
                { color: selected ? theme.paper : theme.ink },
              ]}
            >
              {category.label}
            </Text>
          </MotionPressable>
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
    <MotionPressable
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
          backgroundColor: pressed ? theme.accentSoft : theme.fill,
        },
        first && styles.rowFirst,
        last && styles.rowLast,
      ]}
    >
      <PlaceBadge poi={poi} theme={theme} size={40} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.ink }]}>
          {poi.name}
        </Text>
        <Text numberOfLines={2} style={[styles.meta, { color: theme.muted }]}>
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
    </MotionPressable>
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
      <View style={[styles.emptyIcon, { backgroundColor: theme.fill }]}>
        <Icon name={icon} color={theme.inkSecondary} size={26} strokeWidth={2} />
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
      <MotionPressable
        onPress={onReset}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.reset,
          { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.resetText, { color: theme.primaryText }]}>
          {action}
        </Text>
      </MotionPressable>
    </View>
  );
}
const styles = StyleSheet.create({
  browse: { flexDirection: "row", justifyContent: "space-between" },
  browseItem: { alignItems: "center", gap: space.sm, minWidth: 48 },
  browseIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  browseLabel: { fontSize: textSize.caption, fontWeight: "600" },
  chips: { gap: space.sm, paddingHorizontal: space.lg },
  chip: {
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  chipText: { fontSize: textSize.subhead, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    minHeight: 64,
  },
  rowFirst: {
    borderCurve: "continuous",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  rowLast: {
    borderCurve: "continuous",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  divider: {
    position: "absolute",
    bottom: 0,
    left: 64,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1, gap: space.xxs },
  name: { fontSize: textSize.body, fontWeight: "600", letterSpacing: -0.2 },
  meta: { fontSize: textSize.footnote, lineHeight: 18 },
  empty: { padding: space.xxl, alignItems: "center", gap: space.md },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.rounded,
    fontSize: textSize.title,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: { textAlign: "center" },
  reset: {
    height: 48,
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: space.xxl,
  },
  resetText: { fontFamily: fonts.rounded, fontSize: 16, fontWeight: "700" },
});
