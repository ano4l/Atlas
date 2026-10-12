import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Theme, shadows } from "../theme";
import { POIItem } from "../map/types";
import { DemoRoute } from "../map/demo-routing";
import { Icon } from "./Icon";
import { FeedbackContext, MotionPressable, MotionSurface } from "./Motion";
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
};
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
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const { height } = useWindowDimensions();
  const { reducedMotion } = useContext(FeedbackContext);
  const step = route.steps[currentStepIndex];
  const next = route.steps[currentStepIndex + 1];
  const progress = currentStepIndex / Math.max(1, route.steps.length - 1);
  const fill = useRef(new Animated.Value(progress)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    fill.stopAnimation();
    Animated.timing(fill, {
      toValue: progress,
      duration: reducedMotion ? 0 : 180,
      useNativeDriver: true,
    }).start();
    return () => fill.stopAnimation();
  }, [progress, reducedMotion, fill]);
  return (
    <>
      <MotionSurface
        key={step.id}
        onLayout={(event) =>
          onInstructionHeightChange(event.nativeEvent.layout.height)
        }
        style={[
          styles.instruction,
          { backgroundColor: theme.primary },
          shadows.medium,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            step.floorName + ". " + step.instruction + ". Show route steps."
          }
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          style={styles.instructionRow}
        >
          <Icon
            name={
              step.icon === "lift"
                ? "lift"
                : step.icon === "arrive"
                  ? "check"
                  : "route"
            }
            color={theme.primaryText}
            size={28}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.kicker, { color: theme.primaryText }]}>
              {step.distanceM ? step.distanceM + " m · " : ""}
              {step.floorName}
            </Text>
            <Text
              style={[styles.instructionText, { color: theme.primaryText }]}
            >
              {step.instruction}
            </Text>
          </View>
          <Icon name="layers" color={theme.primaryText} size={18} />
        </Pressable>
      </MotionSurface>
      <MotionSurface
        onLayout={(event) => onHeightChange(event.nativeEvent.layout.height)}
        style={[
          styles.panel,
          {
            backgroundColor: theme.paper,
            borderColor: theme.line,
            maxHeight: height * 0.5,
          },
          shadows.medium,
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.title, { color: theme.ink }]}>
                {destination.name}
              </Text>
              <Text style={[styles.kicker, { color: theme.muted }]}>
                Demo journey · Step {currentStepIndex + 1} of{" "}
                {route.steps.length}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Stop demo navigation"
              onPress={onStopNavigation}
              style={styles.close}
            >
              <Icon name="close" color={theme.muted} />
            </Pressable>
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Demo route steps"
            accessibilityValue={{
              min: 0,
              max: route.steps.length - 1,
              now: currentStepIndex,
            }}
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            style={[styles.track, { backgroundColor: theme.subtle }]}
          >
            <Animated.View
              style={[
                styles.fill,
                {
                  width: trackWidth,
                  backgroundColor: theme.accent,
                  // Scale around the centre, then offset to keep the left edge fixed.
                  transform: [
                    {
                      translateX: fill.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-trackWidth / 2, 0],
                      }),
                    },
                    { scaleX: fill },
                  ],
                },
              ]}
            />
          </View>
          <Text style={[styles.meta, { color: theme.muted }]}>
            {next ? "Then · " + next.instruction : step.subInstruction}
          </Text>
          {expanded && (
            <MotionSurface style={styles.steps}>
              {route.steps.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.step, { borderColor: theme.line }]}
                  accessible
                  accessibilityLabel={`${index < currentStepIndex ? "Completed. " : index === currentStepIndex ? "Current. " : ""}Step ${index + 1}. ${item.floorName}. ${item.instruction}`}
                >
                  <View
                    style={[
                      styles.stepBadge,
                      {
                        backgroundColor:
                          index === currentStepIndex
                            ? theme.accentSoft
                            : theme.subtle,
                      },
                    ]}
                  >
                    {index < currentStepIndex ? (
                      <Icon name="check" color={theme.accent} size={16} />
                    ) : (
                      <Text style={[styles.kicker, { color: theme.accent }]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.kicker, { color: theme.muted }]}>
                      {item.floorName}
                      {index === currentStepIndex ? " · Current step" : ""}
                    </Text>
                    <Text style={[styles.meta, { color: theme.ink }]}>
                      {item.instruction}
                    </Text>
                  </View>
                </View>
              ))}
            </MotionSurface>
          )}
        </ScrollView>
        <View style={styles.actions}>
          <MotionPressable
            accessibilityRole="button"
            onPress={onNextStep}
            style={({ pressed }) => [
              styles.next,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.action, { color: theme.primaryText }]}>
              {next ? "Next demo step" : "Finish demo journey"}
            </Text>
            <Icon name="arrow" color={theme.primaryText} size={20} />
          </MotionPressable>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              onPress={following ? onOverview : onFollow}
              style={[styles.details, { backgroundColor: theme.accentSoft }]}
            >
              <Icon
                name={following ? "map" : "locate"}
                color={theme.accent}
                size={18}
              />
              <Text style={[styles.action, { color: theme.accent }]}>
                {following ? "Overview" : "Resume"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setExpanded((value) => !value)}
              style={styles.details}
            >
              <Text style={[styles.action, { color: theme.accent }]}>
                {expanded ? "Hide steps" : "Route steps"}
              </Text>
            </Pressable>
          </View>
        </View>
      </MotionSurface>
    </>
  );
}
const styles = StyleSheet.create({
  instruction: {
    position: "absolute",
    top: 12,
    left: 20,
    right: 20,
    borderRadius: 24,
    padding: 16,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
  kicker: { fontSize: 12 },
  instructionText: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 84,
    borderWidth: 1,
    borderRadius: 28,
    overflow: "hidden",
  },
  content: { padding: 20, paddingBottom: 12, gap: 12 },
  actions: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.5 },
  meta: { fontSize: 16, lineHeight: 22 },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { height: 4, borderRadius: 4, overflow: "hidden" },
  fill: { height: 4, borderRadius: 4 },
  next: {
    minHeight: 52,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  action: { fontSize: 16, fontWeight: "600" },
  details: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  steps: { gap: 4 },
  step: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
