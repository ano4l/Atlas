import React from "react";
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
import { DemoRoute, floorName } from "../map/demo-routing";
import { MotionSurface, MotionPressable } from "./Motion";
import { Icon } from "./Icon";
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
  const { height } = useWindowDimensions();
  return (
    <MotionSurface
      onLayout={(event) => onHeightChange(event.nativeEvent.layout.height)}
      style={[
        styles.sheet,
        {
          backgroundColor: theme.paper,
          borderColor: theme.line,
          maxHeight: height * 0.5,
        },
        shadows.medium,
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.heading}>
          <View style={styles.copy}>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {arrived
                ? "DEMO JOURNEY COMPLETE"
                : floorName(poi.floorLevel) + " · " + poi.category}
            </Text>
            <Text style={[styles.title, { color: theme.ink }]}>{poi.name}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            accessibilityLabel={
              (saved ? "Remove " : "Save ") +
              poi.name +
              (saved ? " from saved places" : " to saved places")
            }
            onPress={onToggleSaved}
            style={styles.close}
          >
            <Icon
              name={saved ? "check" : "bookmark"}
              color={saved ? theme.accent : theme.muted}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close destination"
            onPress={onClose}
            style={styles.close}
          >
            <Icon name="close" color={theme.muted} />
          </Pressable>
        </View>
        {saved && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.meta, { color: theme.accent }]}
          >
            Saved on this device
          </Text>
        )}
        {storageIssue && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.meta, { color: theme.muted }]}
          >
            Device storage unavailable. Changes may last only for this session.
          </Text>
        )}
        <Text style={[styles.description, { color: theme.muted }]}>
          {arrived
            ? poi.entranceInfo
            : route
              ? route.walkTimeMin +
                " min walk · " +
                route.distanceM +
                " m · From the demo entrance"
              : "No connected route is available for this destination."}
        </Text>
        {!arrived && (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: stepFree }}
            accessibilityLabel="Step-free route"
            onPress={() => onToggleStepFree(!stepFree)}
            style={[styles.preference, { borderColor: theme.line }]}
          >
            <Icon name="accessibility" color={theme.accent} size={20} />
            <Text style={[styles.preferenceText, { color: theme.ink }]}>
              Step-free route
            </Text>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: stepFree ? theme.accent : theme.line,
                  backgroundColor: stepFree ? theme.accentSoft : theme.paper,
                },
              ]}
            >
              {stepFree && <Icon name="check" color={theme.accent} size={16} />}
            </View>
          </Pressable>
        )}
      </ScrollView>
      <View style={styles.actions}>
        <MotionPressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !route && !arrived }}
          disabled={!route && !arrived}
          onPress={arrived ? onClose : onStartNavigation}
          style={({ pressed }) => [
            styles.primary,
            {
              backgroundColor: theme.primary,
              opacity: !route && !arrived ? 0.4 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <Icon
            name={arrived ? "check" : "route"}
            color={theme.primaryText}
            size={20}
          />
          <Text style={[styles.buttonText, { color: theme.primaryText }]}>
            {arrived ? "Done" : "Start demo navigation"}
          </Text>
        </MotionPressable>
      </View>
    </MotionSurface>
  );
}
const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 84,
    borderRadius: 28,
    borderWidth: 1,
  },
  content: { padding: 20, paddingBottom: 12, gap: 12 },
  actions: { paddingHorizontal: 20, paddingBottom: 20 },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 4 },
  meta: { fontSize: 12 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.5 },
  close: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  description: { fontSize: 16, lineHeight: 20 },
  preference: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  preferenceText: { flex: 1, fontSize: 16 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  save: {
    minHeight: 44,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primary: {
    minHeight: 52,
    borderRadius: 16,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
});
