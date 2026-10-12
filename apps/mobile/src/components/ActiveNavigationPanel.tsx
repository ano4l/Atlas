import React, { useState } from "react";
import {
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
type Props = {
  theme: Theme;
  destination: POIItem;
  route: DemoRoute;
  currentStepIndex: number;
  onNextStep: () => void;
  onStopNavigation: () => void;
};
export function ActiveNavigationPanel({
  theme,
  destination,
  route,
  currentStepIndex,
  onNextStep,
  onStopNavigation,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const { height } = useWindowDimensions();
  const step = route.steps[currentStepIndex];
  const progress = currentStepIndex / Math.max(1, route.steps.length - 1);
  return (
    <>
      <View
        style={[
          styles.instruction,
          { backgroundColor: theme.primary },
          shadows.medium,
        ]}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.turn}>
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
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.kicker, { color: theme.primaryText }]}>
            {step.distanceM ? step.distanceM + " m · " : ""}
            {step.floorName}
          </Text>
          <Text style={[styles.instructionText, { color: theme.primaryText }]}>
            {step.instruction}
          </Text>
        </View>
      </View>
      <View
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
              <Text style={[styles.meta, { color: theme.muted }]}>
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
          <View style={[styles.track, { backgroundColor: theme.subtle }]}>
            <View
              style={[
                styles.fill,
                { width: `${progress * 100}%`, backgroundColor: theme.accent },
              ]}
            />
          </View>
          <Text style={[styles.meta, { color: theme.muted }]}>
            {step.subInstruction}
          </Text>
          {expanded &&
            route.steps.map((s, i) => (
              <View
                key={s.id}
                style={[styles.step, { borderColor: theme.line }]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    {
                      color: i <= currentStepIndex ? theme.accent : theme.muted,
                    },
                  ]}
                >
                  {i < currentStepIndex ? "✓" : i + 1}
                </Text>
                <Text style={[styles.meta, { color: theme.ink, flex: 1 }]}>
                  {s.instruction}
                </Text>
              </View>
            ))}
          <Pressable
            accessibilityRole="button"
            onPress={onNextStep}
            style={({ pressed }) => [
              styles.next,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.action, { color: theme.primaryText }]}>
              {currentStepIndex === route.steps.length - 1
                ? "Finish demo journey"
                : "Next demo step"}
            </Text>
            <Icon name="arrow" color={theme.primaryText} size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={styles.details}
          >
            <Text
              style={[styles.meta, { color: theme.accent, fontWeight: "600" }]}
            >
              {expanded ? "Hide route steps" : "View route steps"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
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
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  turn: { width: 32, alignItems: "center" },
  kicker: { fontSize: 12 },
  instructionText: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 84,
    borderWidth: 1,
    borderRadius: 28,
  },
  content: { padding: 20, gap: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.5 },
  meta: { fontSize: 16, lineHeight: 20 },
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
  details: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  step: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
  stepNumber: { width: 24, fontSize: 16, fontWeight: "600" },
});
