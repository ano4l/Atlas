import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme";
import { POIItem } from "../map/types";
import {
  CategoryPicker,
  EmptyPlaces,
  filterPlaces,
  PlaceRow,
} from "./PlaceList";
import { Icon } from "./Icon";
export function ExploreScreen({
  theme,
  onSelectPOI,
}: {
  theme: Theme;
  onSelectPOI: (poi: POIItem) => void;
}) {
  const [category, setCategory] = useState("all");
  const places = filterPlaces("", category);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: theme.muted }]}>
          SANDTON CITY
        </Text>
        <Text style={[styles.title, { color: theme.ink }]}>
          A place for everything.
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Find your next stop, one floor at a time.
        </Text>
      </View>
      <CategoryPicker theme={theme} value={category} onChange={setCategory} />
      <View style={[styles.guide, { backgroundColor: theme.accentSoft }]}>
        <Icon name="map" color={theme.accent} size={24} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.guideTitle, { color: theme.ink }]}>
            Your venue, at a glance
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            2 floors · Shops, dining & useful facilities
          </Text>
        </View>
      </View>
      <View style={styles.listHeading}>
        <Text style={[styles.section, { color: theme.ink }]}>
          Explore places
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {places.length} places
        </Text>
      </View>
      <View
        style={[
          styles.list,
          { backgroundColor: theme.paper, borderColor: theme.line },
        ]}
      >
        {places.map((p) => (
          <PlaceRow
            key={p.id}
            theme={theme}
            poi={p}
            onPress={() => onSelectPOI(p)}
          />
        ))}
        {!places.length && (
          <EmptyPlaces theme={theme} onReset={() => setCategory("all")} />
        )}
      </View>
      <Text style={[styles.note, { color: theme.muted }]}>
        Demo directory · Names and locations are illustrative.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scroll: { paddingTop: 24, paddingBottom: 112, gap: 24 },
  header: { paddingHorizontal: 24, gap: 8 },
  eyebrow: { fontSize: 12, fontWeight: "600", letterSpacing: 1 },
  title: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    fontWeight: "600",
    maxWidth: 300,
  },
  subtitle: { fontSize: 16, lineHeight: 20 },
  guide: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  guideTitle: { fontSize: 16, fontWeight: "600" },
  listHeading: {
    marginHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: { fontSize: 24, fontWeight: "600", letterSpacing: -0.5 },
  list: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  note: { fontSize: 12, textAlign: "center", marginHorizontal: 24 },
});
