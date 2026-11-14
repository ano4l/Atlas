import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DemoRoute } from "../map/demo-routing";
import { POIItem } from "../map/types";
import { shadows, Theme } from "../theme";
import { Icon } from "./Icon";
import { FeedbackContext, MotionPressable, MotionSurface } from "./Motion";
import { RouteStepsSheet } from "./RouteStepsSheet";
import { radius, space, textSize } from "../theme";

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
const cueFade = FadeIn.duration(180);

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
  const legM = Math.round(step.distanceM * (1 - legProgress));
  const showAhead = !!next && step.distanceM > 0;
  const cue = showAhead ? next : step;
  const cueLabel = showAhead
    ? legM
      ? `In ${legM} m`
      : "Now"
    : cue.icon === "arrive"
      ? "Arrival"
      : cue.floorName;
  const cueInstruction =
    showAhead &&
    cue.icon === "arrive" &&
    cue.instruction.startsWith("You’re at")
      ? `Arrive at ${destination.name}`
      : cue.instruction;
  const remainingM =
    legM +
    route.steps
      .slice(currentStepIndex + 1)
      .reduce((sum, item) => sum + item.distanceM, 0);
  const remainingMin = Math.ceil(remainingM / 70);
  const progress = route.distanceM
    ? Math.max(0, Math.min(1, 1 - remainingM / route.distanceM))
    : 1;
  const fill = useSharedValue(progress);
  useEffect(() => {
    fill.value = reducedMotion
      ? progress
      : withTiming(progress, { duration: 360 });
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
        style={[
          styles.instruction,
          shadows.medium,
          { backgroundColor: theme.chrome },
        ]}
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={`${cueLabel}. ${cueInstruction}. Show route steps.`}
          onPress={() => setStepsVisible(true)}
          style={styles.instructionRow}
        >
          <Animated.View
            key={cue.id}
            entering={reducedMotion ? undefined : cueFade}
            style={styles.direction}
          >
            <Icon
              name={cue.icon === "arrive" ? "pin" : cue.icon}
              color={theme.chromeText}
              size={35}
            />
          </Animated.View>
          <View style={styles.copy}>
            <Text style={[styles.stepMeta, { color: theme.chromeText }]}>
              {cueLabel}
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.instructionText, { color: theme.chromeText }]}
            >
              {cueInstruction}
            </Text>
          </View>
        </MotionPressable>
        <View style={styles.then}>
          <Icon
            name={showAhead && step.icon !== "arrive" ? step.icon : "info"}
            color={theme.chromeText}
            size={17}
          />
          <Text
            numberOfLines={1}
            style={[styles.thenText, { color: theme.chromeText }]}
          >
            {showAhead ? `Now · ${step.instruction}` : step.subInstruction}
          </Text>
        </View>
      </MotionSurface>

      <MotionSurface
        onLayout={(event) =>
          onHeightChange(event.nativeEvent.layout.height + panelGap)
        }
        style={[
          styles.panel,
          shadows.strong,
          { backgroundColor: theme.paper, borderColor: theme.line },
        ]}
      >
        <View style={styles.summary}>
          <View style={styles.copy}>
            <Text style={[styles.eta, { color: theme.ink }]}>
              {remainingM ? (
                <>
                  {remainingMin} min{" "}
                  <Text style={[styles.distance, { color: theme.muted }]}>
                    · {remainingM} m left
                  </Text>
                </>
              ) : (
                "At destination"
              )}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.meta, { color: theme.muted }]}
            >
              {destination.name} · {walking ? "Demo walk" : "Demo paused"}
            </Text>
          </View>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="End demo walk"
            onPress={onStopNavigation}
            style={({ pressed }) => [
              styles.end,
              { backgroundColor: pressed ? theme.accentSoft : theme.subtle },
            ]}
          >
            <Text style={[styles.actionText, { color: theme.ink }]}>End</Text>
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
          style={[styles.track, { backgroundColor: theme.subtle }]}
        >
          <Animated.View
            style={[
              styles.fill,
              { backgroundColor: theme.accent },
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
              styles.play,
              {
                backgroundColor: walking ? theme.accentSoft : theme.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Icon
              name={walking ? "pause" : "play"}
              color={walking ? theme.accent : theme.primaryText}
              size={17}
            />
            <Text
              style={[
                styles.actionText,
                { color: walking ? theme.accent : theme.primaryText },
              ]}
            >
              {walking ? "Pause" : "Continue"}
            </Text>
          </MotionPressable>
          <MotionPressable
            accessibilityRole="button"
            onPress={following ? onOverview : onFollow}
            style={({ pressed }) => [
              styles.action,
              pressed && { backgroundColor: theme.subtle },
            ]}
          >
            <Icon
              name={following ? "fit" : "locate"}
              color={theme.accent}
              size={18}
            />
            <Text style={[styles.actionText, { color: theme.accent }]}>
              {following ? "Overview" : "Follow"}
            </Text>
          </MotionPressable>
          <MotionPressable
            accessibilityRole="button"
            onPress={() => setStepsVisible(true)}
            style={({ pressed }) => [
              styles.action,
              pressed && { backgroundColor: theme.subtle },
            ]}
          >
            <Icon name="steps" color={theme.inkSecondary} size={18} />
            <Text style={[styles.actionText, { color: theme.inkSecondary }]}>
              Steps
            </Text>
          </MotionPressable>
        </View>
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
  instruction: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 8,
    borderRadius: radius.xl,
  },
  instructionRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  direction: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF19",
  },
  copy: { flex: 1, gap: space.xs },
  stepMeta: {
    fontSize: textSize.subhead,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    opacity: 0.84,
  },
  instructionText: {
    fontSize: textSize.title,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  then: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    backgroundColor: "#FFFFFF14",
  },
  thenText: { fontSize: textSize.footnote, flex: 1 },
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: panelGap,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
    borderRadius: radius.sheet,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summary: { flexDirection: "row", alignItems: "center", gap: space.sm },
  eta: {
    fontSize: textSize.title,
    fontWeight: "700",
    letterSpacing: -0.45,
    fontVariant: ["tabular-nums"],
  },
  meta: { fontSize: textSize.footnote, lineHeight: 18 },
  distance: { fontSize: textSize.subhead, fontWeight: "600" },
  track: { height: 3, borderRadius: radius.bar, overflow: "hidden" },
  fill: {
    width: "100%",
    height: 3,
    borderRadius: radius.bar,
    transformOrigin: "left center",
  },
  actions: {
    flexDirection: "row",
    gap: space.sm,
    flexWrap: "wrap",
    alignItems: "center",
  },
  play: {
    flexGrow: 1,
    minHeight: 46,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  action: {
    minHeight: 46,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  actionText: { fontSize: textSize.subhead, fontWeight: "700" },
  end: {
    minHeight: 44,
    minWidth: 48,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
