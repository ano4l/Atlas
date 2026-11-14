import React, { useContext } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DemoRoute } from "../map/demo-routing";
import { Theme } from "../theme";
import { Icon } from "./Icon";
import { FeedbackContext, MotionPressable } from "./Motion";
import { radius, space, textSize } from "../theme";
import { fonts } from "../theme";

export function RouteStepsSheet({
  theme,
  route,
  destinationName,
  currentStepIndex,
  onAdvance,
  onClose,
}: {
  theme: Theme;
  route: DemoRoute;
  destinationName: string;
  currentStepIndex?: number;
  onAdvance?: () => void;
  onClose: () => void;
}) {
  const { reducedMotion } = useContext(FeedbackContext);
  const hasNext =
    currentStepIndex !== undefined && currentStepIndex < route.steps.length - 1;
  return (
    <Modal
      animationType={reducedMotion ? "none" : "slide"}
      onRequestClose={onClose}
    >
      {/* A modal is its own native window, so it needs its own inset provider. */}
      <SafeAreaProvider>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.paper }]}>
        <View style={[styles.header, { borderBottomColor: theme.line }]}>
          <View style={styles.copy}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: theme.ink }]}
            >
              Walking steps
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {destinationName} · Indoor demo
            </Text>
          </View>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Close route steps"
            onPress={onClose}
            style={({ pressed }) => [
              styles.close,
              { backgroundColor: pressed ? theme.accentSoft : theme.subtle },
            ]}
          >
            <Icon name="close" color={theme.ink} size={21} />
          </MotionPressable>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          <View style={[styles.summary, { backgroundColor: theme.accentSoft }]}>
            <Icon name="walking" color={theme.accent} size={21} />
            <View style={styles.copy}>
              <Text style={[styles.label, { color: theme.ink }]}>
                {route.walkTimeMin} min walk · {route.distanceM} m
              </Text>
              <Text style={[styles.meta, { color: theme.inkSecondary }]}>
                From the west demo entrance
              </Text>
            </View>
          </View>
          {route.steps.map((item, index) => {
            const current = currentStepIndex === index;
            const completed =
              currentStepIndex !== undefined && index < currentStepIndex;
            return (
              <View
                key={item.id}
                style={[styles.step, { borderBottomColor: theme.line }]}
              >
                {index < route.steps.length - 1 && (
                  <View
                    style={[styles.connector, { backgroundColor: theme.line }]}
                  />
                )}
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: current
                        ? theme.accentSoft
                        : theme.subtle,
                    },
                  ]}
                >
                  <Icon
                    name={
                      completed
                        ? "check"
                        : item.icon === "arrive"
                          ? "pin"
                          : item.icon
                    }
                    color={
                      current || item.icon === "arrive"
                        ? theme.accent
                        : theme.inkSecondary
                    }
                    size={19}
                  />
                </View>
                <View style={styles.copy}>
                  <Text style={[styles.label, { color: theme.ink }]}>
                    {item.icon === "arrive" &&
                    item.instruction.startsWith("You’re at")
                      ? `Arrive at ${destinationName}`
                      : item.instruction}
                  </Text>
                  <Text
                    style={[
                      styles.meta,
                      { color: current ? theme.accent : theme.muted },
                    ]}
                  >
                    {current
                      ? "Current step · "
                      : completed
                        ? "Completed · "
                        : ""}
                    {item.distanceM ? `${item.distanceM} m · ` : ""}
                    {item.floorName}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: theme.line }]}>
          <MotionPressable
            accessibilityRole="button"
            onPress={onAdvance ?? onClose}
            style={({ pressed }) => [
              styles.done,
              { backgroundColor: pressed ? theme.subtle : theme.accentSoft },
            ]}
          >
            <Text style={[styles.label, { color: theme.accent }]}>
              {onAdvance
                ? hasNext
                  ? "Skip to next step"
                  : "Finish demo walk"
                : "Back to preview"}
            </Text>
          </MotionPressable>
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    padding: space.lg,
    paddingHorizontal: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: fonts.rounded,
    fontSize: textSize.heading, fontWeight: "700", letterSpacing: -0.5 },
  meta: { fontSize: textSize.footnote, lineHeight: 18 },
  copy: { flex: 1, gap: space.xs },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  list: { padding: space.lg },
  summary: {
    minHeight: 60,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    marginBottom: space.sm,
  },
  step: {
    minHeight: 64,
    paddingVertical: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  connector: {
    position: "absolute",
    top: "50%",
    bottom: -22,
    left: 17,
    width: 2,
  },
  badge: {
    width: 36,
    height: 36,
    borderCurve: "continuous",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: textSize.subhead, fontWeight: "700" },
  footer: { padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  done: {
    minHeight: 48,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: space.lg,
  },
});
