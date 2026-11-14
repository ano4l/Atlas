import React, { useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TextInputInstance,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { atlasSandtonVenue, samplePOIs } from "../fixtures";
import { POIItem } from "../map/types";
import { Theme } from "../theme";
import { Icon } from "./Icon";
import {
  BrowseShortcuts,
  categories,
  CategoryPicker,
  EmptyPlaces,
  filterPlaces,
  PlaceRow,
} from "./PlaceList";

import { MotionPressable } from "./Motion";
import { radius, space, textSize } from "../theme";
import { fonts } from "../theme";
type Props = {
  theme: Theme;
  onClose: () => void;
  onSelectPOI: (poi: POIItem) => void;
  reducedMotion?: boolean;
  savedIds: string[];
  recentIds: string[];
  onClearRecent: () => void;
  storageIssue: boolean;
  initialCategory?: string;
  /** Opens with this text already searched, for the home sheet's shortcuts. */
  initialQuery?: string;
  initialSavedOnly: boolean;
  focusSearch: boolean;
};

type PlaceSection = {
  title: string;
  data: POIItem[];
  kind?: "recent" | "featured";
};

const namedStores = filterPlaces("", "anchors");
const placesById = new Map(samplePOIs.map((poi) => [poi.id, poi]));
const fromIds = (ids: string[]) =>
  ids.map((id) => placesById.get(id)).filter((poi): poi is POIItem => !!poi);

export function SearchOverlay({
  theme,
  onClose,
  onSelectPOI,
  reducedMotion,
  savedIds,
  recentIds,
  onClearRecent,
  storageIssue,
  initialCategory = "all",
  initialQuery = "",
  initialSavedOnly,
  focusSearch,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState(
    initialSavedOnly
      ? "saved"
      : initialCategory === "all"
        ? "discover"
        : initialCategory,
  );
  const inputRef = useRef<TextInputInstance>(null);
  const searching = query.trim().length > 0;
  const savedOnly = scope === "saved";
  const discovering = scope === "discover" && !searching;
  const category = scope === "discover" || savedOnly ? "all" : scope;
  const categoryLabel =
    categories.find((item) => item.id === category)?.label ?? "All places";

  const sections = useMemo<PlaceSection[]>(() => {
    if (discovering) {
      const recent = fromIds(recentIds);
      return [
        ...(recent.length
          ? [{ title: "Recent places", data: recent, kind: "recent" as const }]
          : []),
        { title: "Named stores", data: namedStores, kind: "featured" },
      ];
    }

    const matches = filterPlaces(query, category);
    const results = savedOnly
      ? fromIds(savedIds).filter((poi) => matches.includes(poi))
      : matches;
    if (!results.length) return [];
    const count = `${results.length} ${results.length === 1 ? "result" : "results"}`;
    const title = searching
      ? savedOnly
        ? `${count} in Saved`
        : count
      : savedOnly
        ? "Saved places"
        : categoryLabel;
    return [{ title, data: results }];
  }, [
    query,
    category,
    categoryLabel,
    savedIds,
    recentIds,
    discovering,
    savedOnly,
    searching,
  ]);

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  const selectScope = (value: string) => {
    setScope(value);
    Keyboard.dismiss();
  };
  const browse = () => {
    setQuery("");
    selectScope("all");
  };

  return (
    <Modal
      animationType={reducedMotion ? "none" : "fade"}
      onShow={() => {
        if (focusSearch) inputRef.current?.focus();
      }}
      onRequestClose={close}
    >
      {/* A modal is its own native window, so it needs its own inset provider. */}
      <SafeAreaProvider>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.paper }]}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.toolbar}>
            <View style={styles.toolbarRow}>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Close search"
                onPress={close}
                style={({ pressed }) => [
                  styles.backButton,
                  {
                    backgroundColor: pressed ? theme.accentSoft : theme.fill,
                  },
                ]}
              >
                <Icon name="back" color={theme.ink} size={20} strokeWidth={2} />
              </MotionPressable>
              <View style={[styles.field, { backgroundColor: theme.fill }]}>
                <Icon
                  name="search"
                  color={theme.muted}
                  size={20}
                  strokeWidth={2}
                />
                <TextInput
                  ref={inputRef}
                  accessibilityLabel={`Search ${atlasSandtonVenue.venueName} by store name or unit code`}
                  placeholder="Where to?"
                  placeholderTextColor={theme.muted}
                  value={query}
                  onChangeText={setQuery}
                  style={[styles.input, { color: theme.ink }]}
                  selectionColor={theme.accent}
                  keyboardAppearance={theme.isDark ? "dark" : "light"}
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={Keyboard.dismiss}
                />
                {!!query && (
                  <MotionPressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    onPress={() => setQuery("")}
                    style={styles.clearButton}
                  >
                    <View
                      style={[styles.clearDot, { backgroundColor: theme.muted }]}
                    >
                      <Icon
                        name="close"
                        color={theme.paper}
                        size={12}
                        strokeWidth={3}
                      />
                    </View>
                  </MotionPressable>
                )}
              </View>
            </View>
            <View style={styles.scopeRow}>
              <CategoryPicker
                theme={theme}
                value={savedOnly ? "saved" : category}
                onChange={selectScope}
                includeSaved
              />
            </View>
          </View>
          <View style={styles.body}>
            <SectionList<POIItem, PlaceSection>
              sections={sections}
              keyExtractor={(poi) => poi.id}
              stickySectionHeadersEnabled={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={styles.list}
              contentContainerStyle={styles.results}
              ListHeaderComponent={
                <>
                  {discovering && (
                    <View style={styles.shortcuts}>
                      <BrowseShortcuts
                        theme={theme}
                        onBrowse={setQuery}
                        onAll={browse}
                      />
                    </View>
                  )}
                  {!searching && (
                    <Text style={[styles.context, { color: theme.muted }]}>
                      {atlasSandtonVenue.venueName} · Indoor demo
                    </Text>
                  )}
                  {scope === "units" && !searching && (
                    <Text style={[styles.notice, { color: theme.muted }]}>
                      Unit codes identify spaces on the reference map. Tenant
                      names are unconfirmed.
                    </Text>
                  )}
                  {storageIssue && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[styles.notice, { color: theme.muted }]}
                    >
                      Device storage is unavailable. Changes may last only for
                      this session.
                    </Text>
                  )}
                </>
              }
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeading}>
                  <Text
                    accessibilityRole="header"
                    accessibilityLiveRegion={searching ? "polite" : "none"}
                    style={[styles.title, { color: theme.ink }]}
                  >
                    {section.title}
                  </Text>
                  {section.kind === "recent" && (
                    <MotionPressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear recent places"
                      onPress={onClearRecent}
                      style={styles.sectionAction}
                    >
                      <Text style={[styles.action, { color: theme.accent }]}>
                        Clear
                      </Text>
                    </MotionPressable>
                  )}
                  {section.kind === "featured" && (
                    <MotionPressable
                      accessibilityRole="button"
                      accessibilityLabel="Browse the full directory"
                      onPress={browse}
                      style={styles.sectionAction}
                    >
                      <Text style={[styles.action, { color: theme.accent }]}>
                        Browse all
                      </Text>
                      <Icon
                        name="chevron-right"
                        color={theme.accent}
                        size={16}
                      />
                    </MotionPressable>
                  )}
                </View>
              )}
              renderItem={({ item, index, section }) => (
                <PlaceRow
                  theme={theme}
                  poi={item}
                  first={index === 0}
                  last={index === section.data.length - 1}
                  saved={!savedOnly && savedIds.includes(item.id)}
                  onPress={() => {
                    onSelectPOI(item);
                    close();
                  }}
                />
              )}
              ListEmptyComponent={
                savedOnly && !savedIds.length && !searching ? (
                  <EmptyPlaces
                    theme={theme}
                    icon="bookmark"
                    title="No saved places yet"
                    message="Open a place and tap its bookmark to find it here later."
                    onReset={browse}
                  />
                ) : (
                  <EmptyPlaces
                    theme={theme}
                    action={
                      searching && (savedOnly || category !== "all")
                        ? "Search all places"
                        : undefined
                    }
                    onReset={
                      searching && (savedOnly || category !== "all")
                        ? () => selectScope("all")
                        : browse
                    }
                  />
                )
              }
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  toolbar: { paddingTop: space.sm, paddingBottom: space.md, gap: space.md },
  toolbarRow: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  scopeRow: { width: "100%", maxWidth: 680, alignSelf: "center" },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingLeft: space.lg,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 50,
    paddingRight: space.sm,
    paddingVertical: 0,
    fontFamily: fonts.rounded,
    fontSize: 17,
    fontWeight: "600",
  },
  clearButton: {
    width: 44,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  clearDot: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  list: { flex: 1, alignSelf: "center", width: "100%", maxWidth: 680 },
  results: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  shortcuts: { paddingTop: space.sm, paddingBottom: space.lg },
  context: { fontSize: textSize.footnote, fontWeight: "500" },
  sectionHeading: {
    minHeight: 48,
    marginTop: space.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: space.xs,
  },
  title: {
    fontFamily: fonts.rounded,
    fontSize: textSize.title,
    fontWeight: "700",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  action: { fontSize: textSize.subhead, fontWeight: "600" },
  sectionAction: {
    minWidth: 48,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xs,
    gap: space.xs,
  },
  notice: {
    fontSize: textSize.footnote,
    lineHeight: 18,
    paddingVertical: space.sm,
  },
});
