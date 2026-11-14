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
import { SafeAreaView } from "react-native-safe-area-context";
import { atlasSandtonVenue, samplePOIs } from "../fixtures";
import { POIItem } from "../map/types";
import { Theme } from "../theme";
import { Icon } from "./Icon";
import {
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
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.paper }]}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.toolbar, { borderColor: theme.line }]}>
            <View style={styles.toolbarRow}>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Close search"
                onPress={close}
                style={({ pressed }) => [
                  styles.roundButton,
                  pressed && { backgroundColor: theme.subtle },
                ]}
              >
                <Icon name="back" color={theme.ink} size={22} />
              </MotionPressable>
              <View
                style={[
                  styles.field,
                  { backgroundColor: theme.subtle, borderColor: theme.line },
                ]}
              >
                <Icon name="search" color={theme.accent} size={20} />
                <TextInput
                  ref={inputRef}
                  accessibilityLabel={`Search ${atlasSandtonVenue.venueName} by store name or unit code`}
                  placeholder={`Search ${atlasSandtonVenue.venueName}`}
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
                    style={styles.roundButton}
                  >
                    <Icon name="close" color={theme.muted} size={18} />
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
          <View style={[styles.body, { backgroundColor: theme.bg }]}>
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
                  {!searching && (
                    <View style={styles.context}>
                      <Icon name="pin" color={theme.accent} size={16} />
                      <Text style={[styles.meta, { color: theme.muted }]}>
                        {atlasSandtonVenue.venueName} · Indoor demo
                      </Text>
                    </View>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  toolbar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  toolbarRow: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingLeft: space.sm,
    paddingRight: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  scopeRow: { width: "100%", maxWidth: 680, alignSelf: "center" },
  field: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingLeft: space.lg,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingRight: space.sm,
    paddingVertical: space.md,
    fontSize: textSize.body,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  list: { flex: 1, alignSelf: "center", width: "100%", maxWidth: 680 },
  results: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxl },
  context: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.xs,
    paddingTop: space.sm,
  },
  sectionHeading: {
    minHeight: 46,
    paddingLeft: space.xs,
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
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  meta: { fontSize: textSize.footnote, lineHeight: 18, flexShrink: 1 },
  action: { fontSize: textSize.footnote, fontWeight: "600" },
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
    paddingHorizontal: space.xs,
  },
});
