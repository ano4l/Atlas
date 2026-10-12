import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme";
import { Icon, IconName } from "./Icon";
export type TabKey = "map" | "explore" | "settings";
export function BottomTabBar({
  theme,
  activeTab,
  onTabChange,
}: {
  theme: Theme;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string; icon: IconName }[] = [
    { key: "map", label: "Map", icon: "map" },
    { key: "explore", label: "Explore", icon: "compass" },
    { key: "settings", label: "Settings", icon: "settings" },
  ];
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.paper, borderColor: theme.line },
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        const color = active ? theme.accent : theme.muted;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label + " tab"}
            accessibilityState={{ selected: active }}
            onPress={() => onTabChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View
              style={[
                styles.icon,
                active && { backgroundColor: theme.accentSoft },
              ]}
            >
              <Icon name={tab.icon} color={color} size={22} />
            </View>
            <Text
              style={[
                styles.label,
                { color, fontWeight: active ? "600" : "400" },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    flexDirection: "row",
    zIndex: 25,
  },
  tab: { flex: 1, minHeight: 56, alignItems: "center", gap: 4 },
  icon: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12 },
});
