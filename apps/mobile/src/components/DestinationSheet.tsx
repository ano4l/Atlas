import React, { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { atlasSandtonVenue } from "../fixtures";
import { DemoRoute, floorName } from "../map/demo-routing";
import { POIItem } from "../map/types";
import { fonts, radius, space, textSize, Theme } from "../theme";
import { Detent, DetentSheet, DetentSheetHandle } from "./DetentSheet";
import { Icon } from "./Icon";
import { MotionPressable } from "./Motion";
import { PlaceBadge } from "./PlaceBadge";
import { RouteStepsSheet } from "./RouteStepsSheet";

type Props = {
  theme: Theme;
  poi: POIItem;
  route: DemoRoute | null;
  stepFree: boolean;
  arrived: boolean;
  saved: boolean;
  storageIssue: boolean;
  onToggleSaved: () => void;
  onHeightChange: (height: number) => void;
  liveSheetHeight?: SharedValue<number>;
  onStartNavigation: () => void;
  onClose: () => void;
  onToggleStepFree: (value: boolean) => void;
};

export function DestinationSheet({
  theme,
  poi,
  route,
  stepFree,
  arrived,
  saved,
  storageIssue,
  onToggleSaved,
  onHeightChange,
  liveSheetHeight,
  onStartNavigation,
  onClose,
  onToggleStepFree,
}: Props) {
  const sheet = useRef<DetentSheetHandle>(null);
  const [detent, setDetent] = useState<Detent>(1);
  const [summaryHeight, setSummaryHeight] = useState(0);
  const [stepsVisible, setStepsVisible] = useState(false);
  const details = detent === 2;
  const unknownTenant = poi.id.startsWith("unit-");
  const transition = route?.segments.find(
    (segment) => segment.transitionType,
  )?.transitionType;
  const title = arrived ? "Demo walk complete" : poi.name;
  const finish = arrived || !route;

  return (
    <>
      <DetentSheet
        ref={sheet}
        theme={theme}
        label="place details"
        animateIn
        mediumHeight={summaryHeight}
        onDetentChange={setDetent}
        onHeightChange={onHeightChange}
        liveHeight={liveSheetHeight}
        header={
          <View style={styles.header}>
            {arrived ? (
              <View style={[styles.arrival, { backgroundColor: theme.lime }]}>
                <Icon
                  name="check"
                  color={theme.limeInk}
                  size={28}
                  strokeWidth={2.6}
                />
              </View>
            ) : (
              <PlaceBadge poi={poi} theme={theme} size={52} />
            )}
            <View style={styles.copy}>
              <Text
                accessibilityRole="header"
                numberOfLines={2}
                style={[styles.title, { color: theme.ink }]}
              >
                {title}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.meta, { color: theme.muted }]}
              >
                {arrived
                  ? poi.name
                  : atlasSandtonVenue.floors.length > 1
                    ? `${poi.category} · ${floorName(poi.floorLevel)}`
                    : poi.category}
              </Text>
            </View>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={
                saved
                  ? `Remove ${poi.name} from saved places`
                  : `Save ${poi.name}`
              }
              accessibilityState={{ selected: saved }}
              onPress={onToggleSaved}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: saved
                    ? theme.primary
                    : pressed
                      ? theme.accentSoft
                      : theme.fill,
                },
              ]}
            >
              <Icon
                name="bookmark"
                color={saved ? theme.primaryText : theme.inkSecondary}
                size={19}
                strokeWidth={2}
              />
            </MotionPressable>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="Close and return to the map"
              onPress={onClose}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: pressed ? theme.accentSoft : theme.fill },
              ]}
            >
              <Icon
                name="close"
                color={theme.inkSecondary}
                size={18}
                strokeWidth={2.2}
              />
            </MotionPressable>
          </View>
        }
        footer={
          <View style={styles.footer}>
            <MotionPressable
              accessibilityRole="button"
              onPress={finish ? onClose : onStartNavigation}
              style={({ pressed }) => [
                styles.primary,
                finish
                  ? { backgroundColor: theme.fill }
                  : {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 6 },
                    },
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Icon
                name={finish ? "map" : "walking"}
                color={finish ? theme.ink : theme.primaryText}
                size={22}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: finish ? theme.ink : theme.primaryText },
                ]}
              >
                {finish ? "Back to map" : "Start demo walk"}
              </Text>
            </MotionPressable>
            {!finish && (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Preview walking steps"
                onPress={() => setStepsVisible(true)}
                style={({ pressed }) => [
                  styles.secondary,
                  {
                    backgroundColor: pressed ? theme.accentSoft : theme.fill,
                  },
                ]}
              >
                <Icon
                  name="steps"
                  color={theme.ink}
                  size={20}
                  strokeWidth={2}
                />
                <Text style={[styles.secondaryLabel, { color: theme.ink }]}>
                  Steps
                </Text>
              </MotionPressable>
            )}
          </View>
        }
      >
        <View style={styles.content}>
          {/* The middle detent ends exactly below this summary. */}
          <View
            style={styles.summary}
            onLayout={(event) =>
              setSummaryHeight(event.nativeEvent.layout.height)
            }
          >
            {arrived ? (
              <Text style={[styles.body, { color: theme.inkSecondary }]}>
                {unknownTenant
                  ? "The demo ends at the gallery near this unit."
                  : "The demo has reached this destination."}
              </Text>
            ) : route ? (
              <View
                accessible
                accessibilityLabel={`${route.walkTimeMin} minute walk, ${route.distanceM} metres, estimated from the west demo entrance`}
                style={[styles.stats, { backgroundColor: theme.fill }]}
              >
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: theme.ink }]}>
                    {route.walkTimeMin}
                    <Text style={styles.statUnit}> min</Text>
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>
                    Walk
                  </Text>
                </View>
                <View
                  style={[styles.statDivider, { backgroundColor: theme.line }]}
                />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: theme.ink }]}>
                    {route.distanceM}
                    <Text style={styles.statUnit}> m</Text>
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>
                    Distance
                  </Text>
                </View>
                <View
                  style={[styles.statDivider, { backgroundColor: theme.line }]}
                />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: theme.ink }]}>
                    {route.steps.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>
                    Steps
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.body, { color: theme.muted }]}>
                No mapped route is available to this place.
              </Text>
            )}
            {!arrived && route && (
              <Text style={[styles.note, { color: theme.muted }]}>
                {unknownTenant
                  ? "Estimate from the west demo entrance. The route ends on the gallery near this unit."
                  : "Estimate from the west demo entrance."}
              </Text>
            )}
            <MotionPressable
              accessibilityRole="button"
              accessibilityState={{ expanded: details }}
              onPress={() => sheet.current?.snapTo(details ? 1 : 2)}
              style={styles.detailAction}
            >
              <Icon name="info" color={theme.inkSecondary} size={18} />
              <Text style={[styles.detailLabel, { color: theme.inkSecondary }]}>
                Place details
              </Text>
              <View style={details && styles.upsideDown}>
                <Icon name="chevron-down" color={theme.muted} size={16} />
              </View>
            </MotionPressable>
            {storageIssue && (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.note, { color: theme.muted }]}
              >
                Device storage is unavailable. Saves may last only for this
                session.
              </Text>
            )}
          </View>
          <View
            pointerEvents={details ? "auto" : "none"}
            accessibilityElementsHidden={!details}
            importantForAccessibility={details ? "auto" : "no-hide-descendants"}
            style={styles.details}
          >
            <Text style={[styles.detailLabel, { color: theme.ink }]}>
              {floorName(poi.floorLevel)}
            </Text>
            {!!poi.description && (
              <Text style={[styles.body, { color: theme.ink }]}>
                {poi.description}
              </Text>
            )}
            <Text style={[styles.note, { color: theme.muted }]}>
              {poi.entranceInfo}
            </Text>
            {transition && (
              <Text style={[styles.note, { color: theme.muted }]}>
                Floor change by {transition === "stairs" ? "stairs" : transition}
                .
              </Text>
            )}
            {!arrived && atlasSandtonVenue.floors.length > 1 && (
              <MotionPressable
                accessibilityRole="checkbox"
                accessibilityLabel="Prefer lifts on demo routes"
                accessibilityState={{ checked: stepFree }}
                onPress={() => onToggleStepFree(!stepFree)}
                style={[
                  styles.detailAction,
                  {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.line,
                  },
                ]}
              >
                <Icon name="accessibility" color={theme.accent} size={20} />
                <Text style={[styles.detailLabel, { color: theme.ink }]}>
                  Prefer lifts
                </Text>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: theme.accent,
                      backgroundColor: stepFree ? theme.accent : theme.paper,
                    },
                  ]}
                >
                  {stepFree && (
                    <Icon name="check" color={theme.primaryText} size={16} />
                  )}
                </View>
              </MotionPressable>
            )}
          </View>
        </View>
      </DetentSheet>
      {route && stepsVisible && (
        <RouteStepsSheet
          theme={theme}
          route={route}
          destinationName={poi.name}
          onClose={() => setStepsVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  copy: { flex: 1, gap: space.xxs, paddingLeft: space.xs },
  title: {
    fontFamily: fonts.rounded,
    fontSize: textSize.heading,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  meta: { fontSize: textSize.subhead, fontWeight: "500" },
  arrival: {
    width: 52,
    height: 52,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: space.lg },
  summary: { gap: space.sm, paddingBottom: space.sm },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.xl,
    paddingVertical: space.md,
  },
  stat: { flex: 1, alignItems: "center", gap: space.xxs },
  statValue: {
    fontFamily: fonts.rounded,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
  },
  statUnit: { fontSize: textSize.subhead, fontWeight: "700", letterSpacing: 0 },
  statLabel: { fontSize: textSize.caption, fontWeight: "600" },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  body: { fontSize: textSize.subhead, lineHeight: 21 },
  note: { fontSize: textSize.footnote, lineHeight: 18 },
  detailAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  detailLabel: { flex: 1, fontSize: textSize.subhead, fontWeight: "600" },
  details: { gap: space.sm, paddingBottom: space.md },
  upsideDown: { transform: [{ rotate: "180deg" }] },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.lg,
  },
  primary: {
    flex: 1,
    height: 54,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  secondary: {
    height: 54,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingHorizontal: space.xl,
  },
  buttonText: {
    fontFamily: fonts.rounded,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  secondaryLabel: { fontFamily: fonts.rounded, fontSize: 17, fontWeight: "700" },
});
