import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Theme, shadows } from "../theme";
import { Icon, IconName } from "./Icon";
import { atlasSandtonVenue } from "../fixtures";

import { MotionPressable } from "./Motion";
const shortcuts: { id: string; label: string; icon: IconName }[] = [
  { id: "anchors", label: "Named stores", icon: "shop" },
  { id: "units", label: "All units", icon: "layers" },
  { id: "landmarks", label: "Demo start", icon: "pin" },
];
export function FloatingSearchBar({
  theme,
  onPress,
  onCategory,
  onSaved,
  value = "",
}: {
  theme: Theme;
  onPress: () => void;
  onCategory: (category: string) => void;
  onSaved: () => void;
  value?: string;
}) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View
        style={[
          styles.search,
          { backgroundColor: theme.paper, borderColor: theme.cardBorder },
          shadows.medium,
        ]}
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Search destinations"
          onPress={onPress}
          style={({ pressed }) => [
            styles.searchAction,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.brand, { backgroundColor: theme.chrome }]}>
            <Icon name="compass" color={theme.highlight} size={28} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.eyebrow, { color: theme.muted }]}>
              {atlasSandtonVenue.venueName.toUpperCase()}{" "}
              <Text style={{ color: theme.accent }}> / DEMO</Text>
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: theme.ink }]}
            >
              {value || "Where to?"}
            </Text>
          </View>
          <Icon name="search" color={theme.ink} size={22} />
        </MotionPressable>
        <View style={[styles.divider, { backgroundColor: theme.line }]} />
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Open saved places"
          onPress={onSaved}
          style={styles.saved}
        >
          <Icon name="bookmark" color={theme.accent} size={22} />
        </MotionPressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shortcuts}
      >
        {shortcuts.map((item) => (
          <MotionPressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Find ${item.label.toLowerCase()}`}
            onPress={() => onCategory(item.id)}
            style={({ pressed }) => [
              styles.chip,
              shadows.soft,
              {
                backgroundColor: theme.paper,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Icon
              name={item.icon}
              color={
                item.id === "food"
                  ? theme.foodInk
                  : item.id === "services"
                    ? theme.facilityInk
                    : theme.shoppingInk
              }
              size={18}
            />
            <Text style={[styles.chipText, { color: theme.ink }]}>
              {item.label}
            </Text>
          </MotionPressable>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    zIndex: 20,
    gap: 8,
  },
  search: {
    marginHorizontal: 16,
    minHeight: 76,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
  },
  searchAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    paddingRight: 8,
  },
  brand: {
    width: 44,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 3 },
  eyebrow: { fontSize: 12, fontWeight: "600", letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.8 },
  divider: { width: 1, height: 28 },
  saved: {
    width: 44,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcuts: { gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
});
