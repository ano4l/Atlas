import React, { useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
        <Pressable
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
        </Pressable>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="End demo walk"
            onPress={onStopNavigation}
            style={({ pressed }) => [
              styles.end,
              { backgroundColor: pressed ? theme.accentSoft : theme.subtle },
            ]}
          >
            <Text style={[styles.actionText, { color: theme.ink }]}>End</Text>
          </Pressable>
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
          <Pressable
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
          </Pressable>
          <Pressable
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
          </Pressable>
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
    borderRadius: 20,
  },
  instructionRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  direction: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF19",
  },
  copy: { flex: 1, gap: 3 },
  stepMeta: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    opacity: 0.84,
  },
  instructionText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  then: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: "#FFFFFF14",
  },
  thenText: { fontSize: 13, flex: 1 },
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: panelGap,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summary: { flexDirection: "row", alignItems: "center", gap: 8 },
  eta: {
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.45,
    fontVariant: ["tabular-nums"],
  },
  meta: { fontSize: 13, lineHeight: 18 },
  distance: { fontSize: 14, fontWeight: "600" },
  track: { height: 3, borderRadius: 2, overflow: "hidden" },
  fill: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    transformOrigin: "left center",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "center",
  },
  play: {
    flexGrow: 1,
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  action: {
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  actionText: { fontSize: 14, fontWeight: "700" },
  end: {
    minHeight: 44,
    minWidth: 48,
    paddingHorizontal: 12,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
