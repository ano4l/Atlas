import React, { useContext, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";
import { atlasSandtonVenue } from "../fixtures";
import { DemoRoute, floorName } from "../map/demo-routing";
import { POIItem } from "../map/types";
import { shadows, Theme } from "../theme";
import { Icon } from "./Icon";
import { FeedbackContext, MotionPressable, useFeedback } from "./Motion";
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
  onStartNavigation: () => void;
  onClose: () => void;
  onToggleStepFree: (value: boolean) => void;
};

const panelGap = 8;
const resize = LinearTransition.springify().damping(34).stiffness(280);
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
  onStartNavigation,
  onClose,
  onToggleStepFree,
}: Props) {
  const [details, setDetails] = useState(false);
  const [stepsVisible, setStepsVisible] = useState(false);
  const { reducedMotion } = useContext(FeedbackContext);
  const feedback = useFeedback();
  const { height } = useWindowDimensions();
  const unknownTenant = poi.id.startsWith("unit-");
  const transition = route?.segments.find(
    (segment) => segment.transitionType,
  )?.transitionType;
  const title = arrived ? "Demo walk complete" : poi.name;
  const finish = arrived || !route;

  return (
    <>
      <Animated.View
        entering={reducedMotion ? undefined : reveal}
        layout={reducedMotion ? undefined : resize}
        onLayout={(event) =>
          onHeightChange(event.nativeEvent.layout.height + panelGap)
        }
        style={[
          styles.sheet,
          shadows.strong,
          { backgroundColor: theme.paper, borderColor: theme.line },
        ]}
      >
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
          <Pressable
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
          </Pressable>
        </View>
        <Animated.ScrollView
          layout={reducedMotion ? undefined : resize}
          style={{ maxHeight: Math.max(56, height * 0.27) }}
          contentContainerStyle={styles.content}
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
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: details }}
            onPress={() => {
              feedback();
              setDetails((value) => !value);
            }}
            style={styles.detailAction}
          >
            <Icon name="info" color={theme.inkSecondary} size={18} />
            <Text style={[styles.detailLabel, { color: theme.inkSecondary }]}>
              Place details
            </Text>
            <View style={details && styles.upsideDown}>
              <Icon name="chevron-down" color={theme.muted} size={16} />
            </View>
          </Pressable>
          {details && (
            <Animated.View
              entering={
                reducedMotion ? undefined : FadeIn.duration(180).delay(40)
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
                <Pressable
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
                </Pressable>
              )}
            </Animated.View>
          )}
          {storageIssue && (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.meta, { color: theme.muted }]}
            >
              Device storage is unavailable. Saves may last only for this
              session.
            </Text>
          )}
        </Animated.ScrollView>
        <Animated.View
          layout={reducedMotion ? undefined : resize}
          style={styles.footer}
        >
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
        </Animated.View>
      </Animated.View>
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
  sheet: {
    position: "absolute",
    bottom: panelGap,
    left: 12,
    right: 12,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  arrivalBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.45 },
  estimate: { fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] },
  metric: { fontSize: 15, fontWeight: "500" },
  meta: { fontSize: 13, lineHeight: 17 },
  body: { fontSize: 15, lineHeight: 21 },
  content: { paddingHorizontal: 16, gap: 6 },
  route: {
    minHeight: 64,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  detailLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  details: { gap: 6, paddingBottom: 8 },
  upsideDown: { transform: [{ rotate: "180deg" }] },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  primary: {
    flex: 1,
    minHeight: 50,
    padding: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { flexShrink: 1, fontSize: 16, fontWeight: "700" },
  secondary: {
    minHeight: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryLabel: { fontSize: 14, fontWeight: "700" },
});
