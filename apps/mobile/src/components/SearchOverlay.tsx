import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { radius, shadows, space, Theme } from "../theme";
import { samplePOIs, searchCategories } from "../fixtures";
import { POIItem } from "../map/types";

type Props = {
  theme: Theme;
  visible: boolean;
  onClose: () => void;
  onSelectPOI: (poi: POIItem) => void;
};

export function SearchOverlay({
  theme,
  visible,
  onClose,
  onSelectPOI,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const dark = theme.isDark;

  // Filter POIs by category and query
  const filteredPOIs = samplePOIs.filter((poi) => {
    const matchesQuery =
      poi.name.toLowerCase().includes(query.toLowerCase()) ||
      poi.category.toLowerCase().includes(query.toLowerCase()) ||
      (poi.description ?? "").toLowerCase().includes(query.toLowerCase());

    const matchesCategory =
      activeCategory === "all" ||
      (activeCategory === "fashion" && poi.category.includes("Fashion")) ||
      (activeCategory === "food" && poi.category.includes("Dining")) ||
      (activeCategory === "restrooms" && poi.category.includes("Restrooms")) ||
      (activeCategory === "info" && poi.category.includes("Guest")) ||
      (activeCategory === "accessibility" && poi.accessible);

    return matchesQuery && matchesCategory;
  });

  const handleVoiceSearch = () => {
    setIsListeningVoice(true);
    setTimeout(() => {
      setQuery("Zara");
      setIsListeningVoice(false);
    }, 1200);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: dark ? "rgba(18, 20, 23, 0.85)" : "rgba(246, 245, 242, 0.85)" }]}>
        <View style={styles.modalContent}>
          {/* Top Search Field Container */}
          <View
            style={[
              styles.searchHeader,
              {
                backgroundColor: dark ? theme.paper : "rgba(255,255,255,0.96)",
                borderColor: theme.cardBorder,
              },
              shadows.medium,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to map"
              onPress={onClose}
              style={({ pressed }) => [
                styles.backButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.backIcon, { color: theme.ink }]}>←</Text>
            </Pressable>

            <TextInput
              autoFocus
              accessibilityLabel="Search destinations in Sandton City"
              placeholder="Search Sandton City..."
              placeholderTextColor={theme.muted}
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, { color: theme.ink }]}
            />

            {query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search text"
                onPress={() => setQuery("")}
                style={styles.clearBtn}
              >
                <Text style={[styles.clearIcon, { color: theme.muted }]}>✕</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voice search"
                onPress={handleVoiceSearch}
                style={({ pressed }) => [
                  styles.micBtn,
                  {
                    backgroundColor: isListeningVoice ? theme.amberSoft : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.micIcon}>
                  {isListeningVoice ? "🎙️..." : "🎙️"}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Voice Listening Prompt */}
          {isListeningVoice && (
            <View
              style={[
                styles.voiceBanner,
                { backgroundColor: theme.amberSoft, borderColor: theme.amber },
              ]}
            >
              <Text style={[styles.voiceText, { color: theme.amber }]}>
                🎙️ Listening... Say "Zara", "Apple Store", or "Restrooms"
              </Text>
            </View>
          )}

          {/* Category Filter Chips Horizontal Scroll */}
          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={searchCategories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item }) => {
                const isSelected = activeCategory === item.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Filter by ${item.label}`}
                    onPress={() => setActiveCategory(item.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : dark
                          ? "rgba(255,255,255,0.08)"
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
                      {item.icon} {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>

          {/* Search Results List */}
          <FlatList
            data={filteredPOIs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { borderColor: theme.line }]}>
                <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                  No destinations found
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
                  Try searching for "Zara", "Food Court", "Apple", or "Restrooms".
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${item.category}, ${item.floorName}, ${item.walkTimeMin} minutes walk`}
                onPress={() => {
                  onSelectPOI(item);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.resultCard,
                  {
                    backgroundColor: dark ? theme.card : "#FFFFFF",
                    borderColor: theme.cardBorder,
                    opacity: pressed ? 0.9 : 1,
                  },
                  shadows.soft,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleGroup}>
                    {item.sponsored && (
                      <View style={[styles.sponsoredTag, { backgroundColor: theme.amberSoft }]}>
                        <Text style={[styles.sponsoredText, { color: theme.amber }]}>
                          ★ SPONSORED
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.cardTitle, { color: theme.ink }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.cardCategory, { color: theme.muted }]}>
                      {item.category} • {item.floorName}
                    </Text>
                  </View>

                  <View style={styles.timeBadge}>
                    <Text style={[styles.timeText, { color: theme.ink }]}>
                      {item.walkTimeMin} min
                    </Text>
                    <Text style={[styles.distanceText, { color: theme.muted }]}>
                      {item.distanceM} m
                    </Text>
                  </View>
                </View>

                {item.description && (
                  <Text numberOfLines={2} style={[styles.cardDescription, { color: theme.inkSecondary }]}>
                    {item.description}
                  </Text>
                )}
              </Pressable>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  searchHeader: {
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    height: "100%",
  },
  clearBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  clearIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  micBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  micIcon: {
    fontSize: 16,
  },
  voiceBanner: {
    marginTop: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  voiceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  categoriesContainer: {
    marginVertical: 12,
  },
  categoriesList: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  resultsList: {
    gap: 10,
    paddingBottom: 40,
  },
  resultCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitleGroup: {
    gap: 2,
    flex: 1,
  },
  sponsoredTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  sponsoredText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: "500",
  },
  timeBadge: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  distanceText: {
    fontSize: 11,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 28,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
});
