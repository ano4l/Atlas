import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { samplePOIs } from "../fixtures";
import { POIItem } from "../map/types";
import { shadows, Theme } from "../theme";
import { Icon } from "./Icon";
import { FeedbackContext, MotionPressable, useFeedback } from "./Motion";
import { PlaceBadge } from "./PlaceBadge";
import { radius, space, textSize } from "../theme";

const panelGap = 8;
const detentSpring = {
  damping: 28,
  stiffness: 320,
  mass: 0.85,
  overshootClamping: true,
};

export function MapHomeSheet({
  theme,
  savedIds,
  recentIds,
  onSelect,
  onSearch,
  onExplore,
  onSaved,
  onHeightChange,
  liveSheetHeight,
}: {
  theme: Theme;
  savedIds: string[];
  recentIds: string[];
  onSelect: (poi: POIItem) => void;
  onSearch: () => void;
  onExplore: () => void;
  onSaved: () => void;
  onHeightChange: (height: number) => void;
  liveSheetHeight: SharedValue<number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(124);
  const { height } = useWindowDimensions();
  const { reducedMotion } = useContext(FeedbackContext);
  const feedback = useFeedback();
  const progress = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const target = useSharedValue(0);
  const stops = useMemo(
    () =>
      [
        ...new Set([
          "unit-s026",
          "unit-s068",
          "unit-s104",
          ...recentIds,
          ...savedIds,
          "woolworths",
          "checkers",
          "clicks",
          "edgars",
          "mr-price",
        ]),
      ]
        .map((id) => samplePOIs.find((poi) => poi.id === id))
        .filter((poi): poi is POIItem => !!poi)
        .slice(0, 5),
    [recentIds, savedIds],
  );
  const travel = Math.max(
    84,
    Math.min(stops.length * 62 + 46, height * 0.32, 320),
  );
  const collapsedHeight =
    headerHeight + panelGap + StyleSheet.hairlineWidth * 2;

  useEffect(() => {
    onHeightChange(collapsedHeight + (expanded ? travel : 0));
  }, [collapsedHeight, expanded, onHeightChange, travel]);
  useAnimatedReaction(
    () => collapsedHeight + travel * progress.value,
    (value) => {
      liveSheetHeight.value = value;
    },
  );
  const clipStyle = useAnimatedStyle(() => ({
    height: travel * progress.value,
  }));
  const listStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.8),
    transform: [{ translateY: 8 * (1 - progress.value) }],
  }));
  const commit = (next: boolean) => {
    setExpanded(next);
    if (expanded !== next) feedback();
  };
  const toggle = () => {
    const next = expanded ? 0 : 1;
    target.value = next;
    progress.value = reducedMotion ? next : withSpring(next, detentSpring);
    commit(next === 1);
  };
  const drag = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-18, 18])
    .onStart(() => {
      cancelAnimation(progress);
      dragStart.value = progress.value;
    })
    .onUpdate(({ translationY }) => {
      if (!reducedMotion)
        progress.value = Math.min(
          1,
          Math.max(0, dragStart.value - translationY / travel),
        );
    })
    .onEnd(({ translationY, velocityY }, success) => {
      const projected =
        dragStart.value - (translationY + velocityY * 0.12) / travel;
      const next = success ? Number(projected > 0.5) : target.value;
      target.value = next;
      progress.value = reducedMotion ? next : withSpring(next, detentSpring);
      if (success) runOnJS(commit)(next === 1);
    });

  return (
    <View
      style={[
        styles.sheet,
        shadows.medium,
        { backgroundColor: theme.paper, borderColor: theme.line },
      ]}
    >
      <View
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <GestureDetector gesture={drag}>
          <MotionPressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={
              expanded ? "Collapse suggested places" : "Expand suggested places"
            }
            onPress={toggle}
            style={styles.handle}
          >
            <View style={[styles.grabber, { backgroundColor: theme.muted }]} />
          </MotionPressable>
        </GestureDetector>
        <MotionPressable
          accessibilityRole="button"
          onPress={onSearch}
          style={({ pressed }) => [
            styles.search,
            {
              backgroundColor: pressed ? theme.accentSoft : theme.subtle,
              borderColor: theme.line,
            },
          ]}
        >
          <Icon name="search" color={theme.accent} size={22} />
          <Text style={[styles.searchLabel, { color: theme.ink }]}>
            Search stores and units
          </Text>
        </MotionPressable>
        <View style={styles.discovery}>
          <Text style={[styles.discoveryTitle, { color: theme.ink }]}>
            Explore the demo
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.discoveryRow}
          >
            {stops.slice(0, 5).map((poi) => (
              <MotionPressable
                key={poi.id}
                accessibilityRole="button"
                accessibilityLabel={`Preview ${poi.name}`}
                onPress={() => onSelect(poi)}
                style={({ pressed }) => [
                  styles.discoveryCard,
                  {
                    backgroundColor: pressed ? theme.accentSoft : theme.subtle,
                    borderColor: theme.line,
                  },
                ]}
              >
                <PlaceBadge poi={poi} theme={theme} size={32} />
                <View style={styles.placeCopy}>
                  <Text
                    numberOfLines={1}
                    style={[styles.name, { color: theme.ink }]}
                  >
                    {poi.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.caption, { color: theme.muted }]}
                  >
                    {poi.demo ? "Demo / " : ""}
                    {poi.category}
                  </Text>
                </View>
                <Icon name="chevron-right" color={theme.muted} size={14} />
              </MotionPressable>
            ))}
          </ScrollView>
        </View>
        <View style={styles.actions}>
          <MotionPressable
            accessibilityRole="button"
            onPress={onExplore}
            style={({ pressed }) => [
              styles.action,
              pressed && { backgroundColor: theme.subtle },
            ]}
          >
            <Icon name="layers" color={theme.inkSecondary} size={17} />
            <Text style={[styles.actionLabel, { color: theme.inkSecondary }]}>
              Directory
            </Text>
          </MotionPressable>
          <View style={[styles.divider, { backgroundColor: theme.line }]} />
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={
              savedIds.length
                ? `Saved places, ${savedIds.length}`
                : "Saved places"
            }
            onPress={onSaved}
            style={({ pressed }) => [
              styles.action,
              pressed && { backgroundColor: theme.subtle },
            ]}
          >
            <Icon name="bookmark" color={theme.inkSecondary} size={17} />
            <Text style={[styles.actionLabel, { color: theme.inkSecondary }]}>
              Saved
            </Text>
          </MotionPressable>
        </View>
      </View>
      <Animated.View style={[styles.clip, clipStyle]}>
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          accessibilityElementsHidden={!expanded}
          importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
          style={[styles.listLayer, { height: travel }, listStyle]}
        >
          <ScrollView contentContainerStyle={styles.list}>
            <Text
              accessibilityRole="header"
              style={[styles.listHeading, { color: theme.ink }]}
            >
              Suggested places
            </Text>
            {stops.map((poi, index) => (
              <MotionPressable
                key={poi.id}
                accessibilityRole="button"
                accessibilityLabel={`Preview ${poi.name}`}
                onPress={() => onSelect(poi)}
                style={({ pressed }) => [
                  styles.listItem,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.line,
                  },
                  pressed && { backgroundColor: theme.accentSoft },
                ]}
              >
                <PlaceBadge poi={poi} theme={theme} size={38} />
                <View style={styles.placeCopy}>
                  <Text style={[styles.name, { color: theme.ink }]}>
                    {poi.name}
                  </Text>
                  <Text style={[styles.caption, { color: theme.muted }]}>
                    {recentIds.includes(poi.id)
                      ? "Recently viewed"
                      : savedIds.includes(poi.id)
                        ? "Saved place"
                        : poi.category}
                  </Text>
                </View>
                <Icon name="chevron-right" color={theme.muted} size={17} />
              </MotionPressable>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: panelGap,
    left: 12,
    right: 12,
    borderRadius: radius.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
  },
  handle: { height: 28, alignItems: "center", justifyContent: "center" },
  grabber: { width: 32, height: 4, borderRadius: radius.bar, opacity: 0.46 },
  search: {
    marginHorizontal: space.md,
    minHeight: 54,
    borderRadius: radius.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  searchLabel: {
    flex: 1,
    fontSize: textSize.body,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  discovery: { paddingTop: space.md, gap: space.sm },
  discoveryTitle: { paddingHorizontal: space.lg, fontSize: textSize.footnote, fontWeight: "600" },
  discoveryRow: { paddingHorizontal: space.md, gap: space.sm, paddingBottom: space.sm },
  discoveryCard: {
    width: 210,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingBottom: space.xs,
    paddingTop: space.xxs,
  },
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    paddingVertical: space.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  actionLabel: { fontSize: textSize.subhead, fontWeight: "600" },
  divider: { height: 18, width: StyleSheet.hairlineWidth },
  clip: { overflow: "hidden" },
  listLayer: { position: "absolute", left: 0, right: 0, top: 0 },
  list: { paddingHorizontal: space.lg, paddingBottom: space.md },
  listHeading: {
    fontSize: textSize.body,
    fontWeight: "700",
    paddingVertical: space.sm,
    paddingTop: space.md,
  },
  listItem: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.sm,
  },
  placeCopy: { flex: 1, gap: space.xs },
  name: { fontSize: textSize.subhead, fontWeight: "600" },
  caption: { fontSize: textSize.footnote },
});
