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
import { Icon } from "./Icon";
type Props = {
  theme: Theme;
  poi: POIItem;
  route: DemoRoute | null;
  stepFree: boolean;
  arrived: boolean;
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
  onStartNavigation,
  onClose,
  onToggleStepFree,
}: Props) {
  const { height } = useWindowDimensions();
  return (
    <View
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
          <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
            <Icon
              name={arrived ? "check" : "pin"}
              color={theme.accent}
              size={24}
            />
          </View>
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
            accessibilityLabel="Close destination"
            onPress={onClose}
            style={styles.close}
          >
            <Icon name="close" color={theme.muted} />
          </Pressable>
        </View>
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
        <Pressable
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
        </Pressable>
      </ScrollView>
    </View>
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
  content: { padding: 20, gap: 16 },
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
