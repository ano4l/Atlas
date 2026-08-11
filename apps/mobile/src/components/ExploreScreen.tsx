import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { radius, shadows, space, Theme } from "../theme";
import { samplePOIs, searchCategories } from "../fixtures";
import { POIItem } from "../map/types";

type Props = {
  theme: Theme;
  onSelectPOI: (poi: POIItem) => void;
};

export function ExploreScreen({ theme, onSelectPOI }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const dark = theme.isDark;

  const filteredItems = samplePOIs.filter((poi) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "fashion") return poi.category.includes("Fashion");
    if (selectedCategory === "food") return poi.category.includes("Dining");
    if (selectedCategory === "restrooms") return poi.category.includes("Restrooms");
    if (selectedCategory === "info") return poi.category.includes("Guest");
    if (selectedCategory === "accessibility") return poi.accessible;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            EXPLORE SANDTON CITY
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Shops & Facilities
          </Text>
        </View>

        {/* Categories Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBar}
        >
          {searchCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Category ${cat.label}`}
                onPress={() => setSelectedCategory(cat.id)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : dark
                      ? "rgba(255,255,255,0.06)"
                      : "#FFFFFF",
                    borderColor: isSelected ? theme.primary : theme.line,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? theme.primaryText : theme.ink,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {cat.icon} {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Featured / Promoted Section Banner */}
        <View
          style={[
            styles.promoBanner,
            {
              backgroundColor: dark ? "rgba(245, 158, 11, 0.1)" : "#FEF3C7",
              borderColor: theme.amber,
            },
          ]}
        >
          <View style={styles.promoTextGroup}>
            <Text style={[styles.promoTag, { color: theme.amber }]}>
              ★ FEATURED PARTNER
            </Text>
            <Text style={[styles.promoTitle, { color: theme.ink }]}>
              Nike Summer Collection
            </Text>
            <Text style={[styles.promoSub, { color: theme.inkSecondary }]}>
              Ground Floor • South Concourse • 3 min walk
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View Nike Store route"
            onPress={() => {
              const nikePOI = samplePOIs.find((p) => p.id === "nike") ?? samplePOIs[0];
              onSelectPOI(nikePOI);
            }}
            style={({ pressed }) => [
              styles.promoBtn,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.promoBtnText, { color: theme.primaryText }]}>
              View
            </Text>
          </Pressable>
        </View>

        {/* Destination List */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: theme.inkSecondary }]}>
            NEARBY PLACES ({filteredItems.length})
          </Text>

          {filteredItems.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.name}, ${item.floorName}`}
              onPress={() => onSelectPOI(item)}
              style={({ pressed }) => [
                styles.itemCard,
                {
                  backgroundColor: dark ? theme.card : "#FFFFFF",
                  borderColor: theme.cardBorder,
                  opacity: pressed ? 0.88 : 1,
                },
                shadows.soft,
              ]}
            >
              <View style={styles.cardMain}>
                <View style={styles.cardTextGroup}>
                  {item.sponsored && (
                    <Text style={[styles.sponsoredBadge, { color: theme.amber }]}>
                      ★ SPONSORED
                    </Text>
                  )}
                  <Text style={[styles.itemTitle, { color: theme.ink }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.muted }]}>
                    {item.category} • {item.floorName}
                  </Text>
                </View>

                <View style={styles.cardRight}>
                  <Text style={[styles.timeText, { color: theme.ink }]}>
                    {item.walkTimeMin} min
                  </Text>
                  <Text style={[styles.distText, { color: theme.muted }]}>
                    {item.distanceM} m
                  </Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderColor: theme.line }]}>
                <Text style={[styles.statusText, { color: theme.emerald }]}>
                  ● {item.openingStatus}
                </Text>
                <Text style={[styles.routeAction, { color: theme.accent }]}>
                  Preview Route ➔
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: space.xl,
    paddingBottom: 100,
    gap: space.lg,
  },
  header: {
    gap: 2,
    marginTop: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  categoryBar: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  promoTextGroup: {
    flex: 1,
    gap: 2,
  },
  promoTag: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  promoSub: {
    fontSize: 12,
  },
  promoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  promoBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  listSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  itemCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTextGroup: {
    gap: 2,
    flex: 1,
  },
  sponsoredBadge: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  itemMeta: {
    fontSize: 13,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "800",
  },
  distText: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  routeAction: {
    fontSize: 12,
    fontWeight: "700",
  },
});
