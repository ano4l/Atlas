import React, { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme } from "../theme";
import { POIItem } from "../map/types";
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
};
export function SearchOverlay({
  theme,
  visible,
  onClose,
  onSelectPOI,
  reducedMotion,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  useEffect(() => {
    if (visible) {
      setQuery("");
      setCategory("all");
    }
  }, [visible]);
  const places = filterPlaces(query, category);
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
            <Text style={[styles.title, { color: theme.ink }]}>
              Find a place
            </Text>
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
          <View style={styles.filters}>
            <CategoryPicker
              theme={theme}
              value={category}
              onChange={setCategory}
            />
          </View>
          <Text style={[styles.resultTitle, { color: theme.muted }]}>
            {query.trim()
              ? places.length + " matching places"
              : "Discover the demo venue"}
          </Text>
          <FlatList
            data={places}
            keyExtractor={(p) => p.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.results}
            renderItem={({ item }) => (
              <PlaceRow
                theme={theme}
                poi={item}
                onPress={() => {
                  onSelectPOI(item);
                  onClose();
                }}
              />
            )}
            ListEmptyComponent={
              <EmptyPlaces
                theme={theme}
                onReset={() => {
                  setQuery("");
                  setCategory("all");
                }}
              />
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
    justifyContent: "space-between",
  },
  title: { fontSize: 32, fontWeight: "600", letterSpacing: -1 },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    margin: 20,
    minHeight: 56,
    paddingLeft: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 16 },
  filters: { marginBottom: 24 },
  resultTitle: { fontSize: 16, marginHorizontal: 24, marginBottom: 12 },
  results: { paddingHorizontal: 20, paddingBottom: 24 },
});
