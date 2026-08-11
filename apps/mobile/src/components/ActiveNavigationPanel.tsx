import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { radius, shadows, space, Theme } from "../theme";
import { NavigationStep, POIItem } from "../map/types";

type Props = {
  theme: Theme;
  destination: POIItem;
  steps: NavigationStep[];
  currentStepIndex: number;
  progressRatio: number; // 0 to 1
  onNextStep: () => void;
  onStopNavigation: () => void;
};

const stepIcons: Record<string, string> = {
  straight: "↑",
  "turn-left": "↰",
  "turn-right": "↱",
  escalator: "↗",
  lift: "↕",
  arrive: "●",
};

export function ActiveNavigationPanel({
  theme,
  destination,
  steps,
  currentStepIndex,
  progressRatio,
  onNextStep,
  onStopNavigation,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const dark = theme.isDark;

  const currentStep = steps[currentStepIndex] ?? steps[0];

  return (
    <View style={styles.panelWrapper} pointerEvents="box-none">
      <View
        style={[
          styles.panel,
          {
            backgroundColor: dark
              ? "rgba(30, 32, 36, 0.96)"
              : "rgba(255, 255, 255, 0.96)",
            borderColor: theme.cardBorder,
          },
          shadows.strong,
        ]}
      >
        {/* Handle / Expand Bar */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Collapse turn-by-turn steps" : "Expand turn-by-turn steps"}
          onPress={() => setExpanded(!expanded)}
          style={styles.expandHeader}
        >
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
        </Pressable>

        {/* Top Active Instruction Row */}
        <View style={styles.instructionRow}>
          {/* Turn Direction Icon Badge */}
          <View
            style={[
              styles.turnBadge,
              { backgroundColor: dark ? "rgba(37, 99, 235, 0.2)" : "#EFF6FF" },
            ]}
          >
            <Text style={[styles.turnIconText, { color: theme.accent }]}>
              {stepIcons[currentStep.icon] ?? "↑"}
            </Text>
          </View>

          {/* Turn Instruction Text & Meta */}
          <View style={styles.instructionTextWrapper}>
            <Text style={[styles.distanceText, { color: theme.accent }]}>
              {currentStep.distanceM > 0
                ? `In ${currentStep.distanceM} m`
                : "Current Step"}
            </Text>
            <Text numberOfLines={2} style={[styles.mainInstruction, { color: theme.ink }]}>
              {currentStep.instruction}
            </Text>
            <Text style={[styles.subInstruction, { color: theme.muted }]}>
              {currentStep.subInstruction} • {currentStep.floorName}
            </Text>
          </View>

          {/* Action Step Control Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next instruction step"
            onPress={onNextStep}
            style={({ pressed }) => [
              styles.stepNextButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.stepNextIcon, { color: theme.primaryText }]}>
              ➔
            </Text>
          </Pressable>
        </View>

        {/* Route Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#E5E5EA" },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.routeMiddle,
                  width: `${Math.min(100, Math.max(5, progressRatio * 100))}%`,
                },
              ]}
            />
          </View>

          <View style={styles.progressMetaRow}>
            <Text style={[styles.progressMetaText, { color: theme.muted }]}>
              Navigating to {destination.name}
            </Text>
            <Text style={[styles.progressMetaText, { color: theme.ink, fontWeight: "700" }]}>
              {Math.round(progressRatio * 100)}% complete
            </Text>
          </View>
        </View>

        {/* Expanded Step-by-Step Directions List */}
        {expanded && (
          <ScrollView
            style={styles.stepsList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <Text style={[styles.stepsListTitle, { color: theme.inkSecondary }]}>
              ALL STEPS ({steps.length})
            </Text>
            {steps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              return (
                <View
                  key={step.id}
                  style={[
                    styles.stepCard,
                    isCurrent && {
                      backgroundColor: dark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(17, 17, 17, 0.03)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepCardIcon,
                      { opacity: isPast ? 0.4 : isCurrent ? 1 : 0.7 },
                    ]}
                  >
                    {stepIcons[step.icon]}
                  </Text>

                  <View style={styles.stepCardTextWrapper}>
                    <Text
                      style={[
                        styles.stepCardTitle,
                        {
                          color: isPast ? theme.muted : theme.ink,
                          fontWeight: isCurrent ? "800" : "600",
                        },
                      ]}
                    >
                      {step.instruction}
                    </Text>
                    <Text style={[styles.stepCardMeta, { color: theme.muted }]}>
                      {step.subInstruction} • {step.floorName}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Bottom Bar: Stop / End Navigation Button */}
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Expand turn-by-turn steps"
            onPress={() => setExpanded(!expanded)}
            style={({ pressed }) => [
              styles.expandToggleBtn,
              {
                backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#F2F1EC",
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.expandToggleText, { color: theme.ink }]}>
              {expanded ? "Hide steps" : "View steps"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop navigation"
            onPress={onStopNavigation}
            style={({ pressed }) => [
              styles.stopButton,
              {
                backgroundColor: dark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.stopText, { color: theme.danger }]}>
              Stop navigation
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelWrapper: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 100,
    zIndex: 22,
  },
  panel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.sm,
  },
  expandHeader: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  turnBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  turnIconText: {
    fontSize: 22,
    fontWeight: "900",
  },
  instructionTextWrapper: {
    flex: 1,
    gap: 1,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  mainInstruction: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  subInstruction: {
    fontSize: 12,
    fontWeight: "500",
  },
  stepNextButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNextIcon: {
    fontSize: 16,
    fontWeight: "800",
  },
  progressContainer: {
    gap: 4,
    marginTop: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressMetaText: {
    fontSize: 11,
  },
  stepsList: {
    maxHeight: 180,
    marginVertical: 4,
  },
  stepsListTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  stepCardIcon: {
    fontSize: 16,
  },
  stepCardTextWrapper: {
    flex: 1,
  },
  stepCardTitle: {
    fontSize: 13,
  },
  stepCardMeta: {
    fontSize: 11,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  expandToggleBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  expandToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  stopButton: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stopText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
