import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DemoRoute } from "../map/demo-routing";
import { POIItem } from "../map/types";
import { fonts, radius, space, textSize, Theme } from "../theme";
import { GlassSurface } from "./GlassSurface";
import { Icon } from "./Icon";
import { FeedbackContext, MotionPressable, MotionSurface } from "./Motion";
import { RouteStepsSheet } from "./RouteStepsSheet";

type Props = {
  theme: Theme;
  destination: POIItem;
  route: DemoRoute;
  currentStepIndex: number;
  onNextStep: () => void;
  onStopNavigation: () => void;
  onHeightChange: (height: number) => void;
  onInstructionHeightChange: (height: number) => void;
  onOverview: () => void;
  onFollow: () => void;
  following: boolean;
  walking: boolean;
  legProgress: number;
  onToggleWalking: () => void;
};

const panelGap = 8;
const clock = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export function ActiveNavigationPanel({
  theme,
  destination,
  route,
  currentStepIndex,
  onNextStep,
  onStopNavigation,
  onHeightChange,
  onInstructionHeightChange,
  onOverview,
  onFollow,
  following,
  walking,
  legProgress,
  onToggleWalking,
}: Props) {
  const [stepsVisible, setStepsVisible] = useState(false);
  const { reducedMotion } = useContext(FeedbackContext);
  const step = route.steps[currentStepIndex];
  const next = route.steps[currentStepIndex + 1];
  const after = route.steps[currentStepIndex + 2];
  const legM = Math.round(step.distanceM * (1 - legProgress));
  // The banner leads with the manoeuvre ahead and how far away it is.
  const ahead = !!next && step.distanceM > 0;
  const cue = ahead ? next : step;
  const arriving = cue.icon === "arrive";
  const cueDistance = ahead ? (legM ? `${legM} m` : "Now") : null;
  const cueInstruction = arriving
    ? `Arrive at ${destination.name}`
    : cue.instruction;
  const thenLine = ahead
    ? after
      ? after.icon === "arrive"
        ? `Then arrive at ${destination.name}`
        : `Then ${after.instruction.charAt(0).toLowerCase()}${after.instruction.slice(1)}`
      : arriving
        ? step.floorName
        : null
    : step.subInstruction;
  const remainingM =
    legM +
    route.steps
      .slice(currentStepIndex + 1)
      .reduce((sum, item) => sum + item.distanceM, 0);
  const remainingMin = Math.ceil(remainingM / 70);
  const progress = route.distanceM
    ? Math.max(0, Math.min(1, 1 - remainingM / route.distanceM))
    : 1;
  // Refreshes with each walk tick, since the panel re-renders on progress.
  const arrival = clock(new Date(Date.now() + remainingMin * 60000));
  const fill = useSharedValue(progress);
  useEffect(() => {
    fill.value = reducedMotion
      ? progress
      : withTiming(progress, { duration: 420 });
  }, [fill, progress, reducedMotion]);
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
  }));

  return (
    <>
      <MotionSurface
        origin="top"
        onLayout={(event) =>
          onInstructionHeightChange(event.nativeEvent.layout.height)
        }
        style={styles.banner}
      >
        <GlassSurface theme={theme} variant="chrome" style={styles.bannerSurface}>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={`${cueDistance ? `In ${cueDistance}. ` : ""}${cueInstruction}. Show route steps.`}
          onPress={() => setStepsVisible(true)}
          style={styles.bannerRow}
        >
          <View style={[styles.turn, { backgroundColor: theme.lime }]}>
            <Icon
              name={cue.icon === "arrive" ? "flag" : cue.icon}
              color={theme.limeInk}
              size={34}
              strokeWidth={2.4}
            />
          </View>
          <View style={styles.copy}>
            {cueDistance && (
              <Text style={[styles.distance, { color: theme.chromeText }]}>
                {cueDistance}
              </Text>
            )}
            <Text
              accessibilityRole="header"
              numberOfLines={2}
              style={[
                cueDistance ? styles.instruction : styles.instructionOnly,
                { color: cueDistance ? theme.chromeMuted : theme.chromeText },
              ]}
            >
              {cueInstruction}
            </Text>
          </View>
        </MotionPressable>
        {!!thenLine && (
          <View style={styles.then}>
            <Icon
              name={ahead && after && after.icon !== "arrive" ? after.icon : "info"}
              color={theme.chromeMuted}
              size={16}
              strokeWidth={2}
            />
            <Text
              numberOfLines={1}
              style={[styles.thenText, { color: theme.chromeMuted }]}
            >
              {thenLine}
            </Text>
          </View>
        )}
        </GlassSurface>
      </MotionSurface>

      <MotionSurface
        onLayout={(event) =>
          onHeightChange(event.nativeEvent.layout.height + panelGap)
        }
        style={styles.panel}
      >
        <GlassSurface theme={theme} variant="panel" style={styles.surface}>
          <Text numberOfLines={1} style={[styles.to, { color: theme.muted }]}>
            Demo walk to{" "}
            <Text style={{ color: theme.ink }}>{destination.name}</Text>
            {walking ? "" : " · paused"}
          </Text>
          <View style={styles.summary}>
            {remainingM ? (
              <View
                accessible
                accessibilityLabel={`Arrive about ${arrival}. ${remainingMin} minutes, ${remainingM} metres left.`}
                style={styles.stats}
              >
                {[
                  [arrival, "arrival"],
                  [String(remainingMin), "min"],
                  [String(remainingM), "m"],
                ].map(([value, label]) => (
                  <View key={label}>
                    <Text style={[styles.statValue, { color: theme.ink }]}>
                      {value}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.muted }]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.statValue, styles.copy, { color: theme.ink }]}>
                Arrived
              </Text>
            )}
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="End demo walk"
              onPress={onStopNavigation}
              style={({ pressed }) => [
                styles.end,
                { backgroundColor: theme.stop, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.endText, { color: theme.stopText }]}>
                End
              </Text>
            </MotionPressable>
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Demo walk progress"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(progress * 100),
            }}
            style={[styles.track, { backgroundColor: theme.fill }]}
          >
            <Animated.View
              style={[
                styles.fill,
                { backgroundColor: theme.primary },
                progressStyle,
              ]}
            />
          </View>
          <View style={styles.actions}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={
                walking ? "Pause demo walk" : "Continue demo walk"
              }
              onPress={onToggleWalking}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: walking ? theme.fill : theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Icon
                name={walking ? "pause" : "play"}
                color={walking ? theme.ink : theme.primaryText}
                size={18}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: walking ? theme.ink : theme.primaryText },
                ]}
              >
                {walking ? "Pause" : "Resume"}
              </Text>
            </MotionPressable>
            <MotionPressable
              accessibilityRole="button"
              onPress={following ? onOverview : onFollow}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: pressed ? theme.accentSoft : theme.fill },
              ]}
            >
              <Icon
                name={following ? "fit" : "locate"}
                color={theme.ink}
                size={18}
                strokeWidth={2}
              />
              <Text style={[styles.actionText, { color: theme.ink }]}>
                {following ? "Overview" : "Follow"}
              </Text>
            </MotionPressable>
            <MotionPressable
              accessibilityRole="button"
              onPress={() => setStepsVisible(true)}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: pressed ? theme.accentSoft : theme.fill },
              ]}
            >
              <Icon name="steps" color={theme.ink} size={18} strokeWidth={2} />
              <Text style={[styles.actionText, { color: theme.ink }]}>
                Steps
              </Text>
            </MotionPressable>
          </View>
        </GlassSurface>
      </MotionSurface>

      {stepsVisible && (
        <RouteStepsSheet
          theme={theme}
          route={route}
          destinationName={destination.name}
          currentStepIndex={currentStepIndex}
          onAdvance={onNextStep}
          onClose={() => setStepsVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  banner: { position: "absolute", left: 10, right: 10, top: 6 },
  bannerSurface: { borderRadius: radius.sheet + 4 },
  bannerRow: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    padding: space.lg,
  },
  turn: {
    width: 60,
    height: 60,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: space.xxs },
  distance: {
    fontFamily: fonts.rounded,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.8,
    fontVariant: ["tabular-nums"],
  },
  instruction: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  instructionOnly: {
    fontFamily: fonts.rounded,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  then: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.xl,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderCurve: "continuous",
    borderBottomLeftRadius: radius.sheet + 4,
    borderBottomRightRadius: radius.sheet + 4,
  },
  thenText: { flex: 1, fontSize: textSize.footnote, fontWeight: "600" },
  panel: { position: "absolute", left: 10, right: 10, bottom: panelGap },
  surface: {
    borderRadius: radius.sheet + 4,
    padding: space.lg,
    gap: space.md,
  },
  summary: { flexDirection: "row", alignItems: "center", gap: space.md },
  to: { fontSize: textSize.footnote, fontWeight: "600" },
  stats: { flex: 1, flexDirection: "row", gap: space.xl },
  statValue: {
    fontFamily: fonts.rounded,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.7,
    fontVariant: ["tabular-nums"],
  },
  statLabel: { fontSize: textSize.caption, fontWeight: "600" },
  end: {
    height: 48,
    paddingHorizontal: space.xxl,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  endText: { fontFamily: fonts.rounded, fontSize: 17, fontWeight: "700" },
  track: { height: 4, borderRadius: radius.bar, overflow: "hidden" },
  fill: {
    width: "100%",
    height: 4,
    borderRadius: radius.bar,
    transformOrigin: "left center",
  },
  actions: { flexDirection: "row", gap: space.sm },
  action: {
    flex: 1,
    height: 48,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  actionText: { fontSize: textSize.subhead, fontWeight: "700" },
});
