import React, { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FadeInUp, SharedValue } from "react-native-reanimated";
import { atlasSandtonVenue } from "../fixtures";
import { DemoRoute, floorName } from "../map/demo-routing";
import { POIItem } from "../map/types";
import { Theme } from "../theme";
import { Detent, DetentSheet, DetentSheetHandle } from "./DetentSheet";
import { Icon } from "./Icon";
import { MotionPressable } from "./Motion";
import { PlaceBadge } from "./PlaceBadge";
import { RouteStepsSheet } from "./RouteStepsSheet";
import { radius, space, textSize } from "../theme";

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

const reveal = FadeInUp.duration(220).withInitialValues({
  opacity: 0,
  transform: [{ translateY: 14 }],
});

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
        strongShadow
        entering={reveal}
        mediumHeight={summaryHeight}
        onDetentChange={setDetent}
        onHeightChange={onHeightChange}
        liveHeight={liveSheetHeight}
        header={
        <View style={styles.header}>
          {arrived ? (
            <View
              style={[
                styles.arrivalBadge,
                { backgroundColor: theme.facilitySoft },
              ]}
            >
              <Icon name="check" color={theme.facilityInk} size={24} />
            </View>
          ) : (
            <PlaceBadge poi={poi} theme={theme} size={46} />
          )}
          <View style={styles.copy}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: theme.ink }]}
            >
              {title}
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {arrived ? poi.name : poi.category}
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
                backgroundColor:
                  saved || pressed ? theme.accentSoft : theme.subtle,
              },
            ]}
          >
            <Icon
              name={saved ? "check" : "bookmark"}
              color={saved ? theme.accent : theme.inkSecondary}
              size={21}
            />
          </MotionPressable>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Close and return to the map"
            onPress={onClose}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: pressed ? theme.accentSoft : theme.subtle },
            ]}
          >
            <Icon name="close" color={theme.inkSecondary} size={21} />
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
              {
                backgroundColor: finish ? theme.subtle : theme.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Icon
              name={finish ? "map" : "walking"}
              color={finish ? theme.ink : theme.primaryText}
              size={22}
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
                { backgroundColor: pressed ? theme.accentSoft : theme.subtle },
              ]}
            >
              <Icon name="steps" color={theme.inkSecondary} size={18} />
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
            <View style={[styles.route, { backgroundColor: theme.accentSoft }]}>
              <Icon name="walking" color={theme.accent} size={24} />
              <View style={styles.copy}>
                <Text style={[styles.estimate, { color: theme.ink }]}>
                  {route.walkTimeMin} min walk{" "}
                  <Text style={[styles.metric, { color: theme.inkSecondary }]}>
                    · {route.distanceM} m
                  </Text>
                </Text>
                <Text style={[styles.meta, { color: theme.inkSecondary }]}>
                  Estimate from the west demo entrance
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.body, { color: theme.muted }]}>
              No mapped route is available to this place.
            </Text>
          )}
          {!arrived && unknownTenant && (
            <Text style={[styles.meta, { color: theme.muted }]}>
              The route ends on the gallery near this unit.
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
              style={[styles.meta, { color: theme.muted }]}
            >
              Device storage is unavailable. Saves may last only for this
              session.
            </Text>
          )}
          </View>
            <View
              pointerEvents={details ? "auto" : "none"}
              accessibilityElementsHidden={!details}
              importantForAccessibility={
                details ? "auto" : "no-hide-descendants"
              }
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
              <Text style={[styles.meta, { color: theme.muted }]}>
                {poi.entranceInfo}
              </Text>
              {transition && (
                <Text style={[styles.meta, { color: theme.muted }]}>
                  Floor change by{" "}
                  {transition === "stairs" ? "stairs" : transition}.
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
    paddingTop: space.xs,
    paddingBottom: space.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  arrivalBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: space.xs },
  title: { fontSize: textSize.heading, fontWeight: "700", letterSpacing: -0.45 },
  estimate: { fontSize: textSize.title, fontWeight: "700", fontVariant: ["tabular-nums"] },
  metric: { fontSize: textSize.subhead, fontWeight: "500" },
  meta: { fontSize: textSize.footnote, lineHeight: 17 },
  body: { fontSize: textSize.subhead, lineHeight: 21 },
  content: { paddingHorizontal: space.lg },
  summary: { gap: space.sm, paddingBottom: space.sm },
  route: {
    minHeight: 64,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  detailAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.xxs,
  },
  detailLabel: { flex: 1, fontSize: textSize.subhead, fontWeight: "600" },
  details: { gap: space.sm, paddingBottom: space.sm },
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
    paddingBottom: space.md,
  },
  primary: {
    flex: 1,
    minHeight: 50,
    padding: space.md,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  buttonText: { flexShrink: 1, fontSize: textSize.body, fontWeight: "700" },
  secondary: {
    minHeight: 50,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  secondaryLabel: { fontSize: textSize.subhead, fontWeight: "700" },
});
