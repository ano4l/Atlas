import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme } from "../theme";
import { POIItem } from "../map/types";
import { samplePOIs } from "../fixtures";
import { Icon } from "./Icon";
import {
  CategoryPicker,
  EmptyPlaces,
  filterPlaces,
  PlaceRow,
} from "./PlaceList";
type Props = {
  theme: Theme;
  visible: boolean;
  onClose: () => void;
  onSelectPOI: (poi: POIItem) => void;
  reducedMotion?: boolean;
  savedIds: string[];
  recentIds: string[];
  onClearRecent: () => void;
  storageIssue: boolean;
};
export function SearchOverlay({
  theme,
  visible,
  onClose,
  onSelectPOI,
  reducedMotion,
  savedIds,
  recentIds,
  onClearRecent,
  storageIssue,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  useEffect(() => {
    if (visible) {
      setQuery("");
      setCategory("all");
      setSavedOnly(false);
    }
  }, [visible]);
  const places = filterPlaces(query, category).filter(
    (poi) => !savedOnly || savedIds.includes(poi.id),
  );
  const suggestions = !savedOnly && !query.trim() && category === "all";
  const byIds = (ids: string[]) =>
    ids
      .map((id) => samplePOIs.find((poi) => poi.id === id))
      .filter((poi): poi is POIItem => !!poi);
  const saved = byIds(savedIds);
  const recent = byIds(recentIds);
  const sections = suggestions
    ? [
        { title: "Saved places", data: saved },
        { title: "Recent places", data: recent },
        {
          title: "Discover the venue",
          data: places.filter(
            (poi) => !savedIds.includes(poi.id) && !recentIds.includes(poi.id),
          ),
        },
      ].filter((section) => section.data.length)
    : [
        {
          title:
            places.length + (savedOnly ? " saved places" : " matching places"),
          data: places,
        },
      ];
  const select = (poi: POIItem) => {
    Keyboard.dismiss();
    onSelectPOI(poi);
    onClose();
  };
  return (
    <Modal
      visible={visible}
      animationType={reducedMotion ? "none" : "slide"}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.heading}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.ink }]}>
                Find a place
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>
                Sandton City · Demo directory
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close search"
              style={styles.close}
            >
              <Icon name="close" color={theme.ink} />
            </Pressable>
          </View>
          <View
            style={[
              styles.inputRow,
              { backgroundColor: theme.paper, borderColor: theme.line },
            ]}
          >
            <Icon name="search" color={theme.accent} size={20} />
            <TextInput
              autoFocus
              accessibilityLabel="Search Sandton City destinations"
              placeholder="Shop, food or facility"
              placeholderTextColor={theme.muted}
              value={query}
              onChangeText={setQuery}
              style={[styles.input, { color: theme.ink }]}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
            {!!query && (
              <Pressable
                onPress={() => setQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={styles.close}
              >
                <Icon name="close" color={theme.muted} size={18} />
              </Pressable>
            )}
          </View>
          <View style={styles.scopes}>
            {[false, true].map((value) => (
              <Pressable
                key={String(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: savedOnly === value }}
                onPress={() => setSavedOnly(value)}
                style={({ pressed }) => [
                  styles.scope,
                  {
                    backgroundColor:
                      savedOnly === value ? theme.accentSoft : theme.paper,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Icon
                  name={value ? "bookmark" : "compass"}
                  color={savedOnly === value ? theme.accent : theme.muted}
                  size={18}
                />
                <Text
                  style={[
                    styles.scopeText,
                    { color: savedOnly === value ? theme.accent : theme.ink },
                  ]}
                >
                  {value ? "Saved (" + savedIds.length + ")" : "All places"}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.filters}>
            <CategoryPicker
              theme={theme}
              value={category}
              onChange={setCategory}
            />
          </View>
          {storageIssue && (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.storage, { color: theme.muted }]}
            >
              Device storage unavailable. Changes may last only for this
              session.
            </Text>
          )}
          <SectionList
            sections={sections}
            keyExtractor={(poi) => poi.id}
            stickySectionHeadersEnabled={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.results}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeading}>
                <Text
                  accessibilityRole="header"
                  style={[styles.sectionTitle, { color: theme.ink }]}
                >
                  {section.title}
                </Text>
                {section.title === "Recent places" && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear recent places"
                    onPress={onClearRecent}
                    style={styles.clear}
                  >
                    <Text style={[styles.scopeText, { color: theme.accent }]}>
                      Clear
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
            renderItem={({ item }) => (
              <PlaceRow theme={theme} poi={item} onPress={() => select(item)} />
            )}
            ListFooterComponent={
              savedOnly &&
              !places.length &&
              !query.trim() &&
              category === "all" ? (
                <View style={[styles.empty, { backgroundColor: theme.paper }]}>
                  <Icon name="bookmark" color={theme.accent} size={28} />
                  <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                    Keep your go-to places
                  </Text>
                  <Text style={[styles.body, { color: theme.muted }]}>
                    Open a destination and tap its bookmark. Your saved places
                    stay on this device.
                  </Text>
                </View>
              ) : !places.length ? (
                <EmptyPlaces
                  theme={theme}
                  onReset={() => {
                    setQuery("");
                    setCategory("all");
                    setSavedOnly(false);
                  }}
                />
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  heading: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 32, fontWeight: "600", letterSpacing: -1 },
  meta: { fontSize: 12, marginTop: 4 },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    margin: 20,
    marginBottom: 12,
    minHeight: 56,
    paddingLeft: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 16 },
  scopes: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scope: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    borderRadius: 12,
    minHeight: 44,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeText: { fontSize: 16, fontWeight: "600" },
  filters: { marginBottom: 8 },
  results: { paddingHorizontal: 20, paddingBottom: 24 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 48,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  clear: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: { padding: 24, gap: 12, borderRadius: 24 },
  body: { fontSize: 16, lineHeight: 22 },
  storage: { paddingHorizontal: 24, fontSize: 12 },
});
