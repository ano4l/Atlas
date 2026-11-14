import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, shadows } from "../theme";
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
      style={[styles.bar, { backgroundColor: theme.chrome }, shadows.strong]}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        const color = active ? theme.highlightInk : theme.chromeText;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label + " tab"}
            accessibilityState={{ selected: active }}
            onPress={() => onTabChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: active ? theme.highlight : "transparent",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon name={tab.icon} color={color} size={22} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 8,
    left: 16,
    right: 16,
    padding: 8,
    borderRadius: 28,
    flexDirection: "row",
    gap: 4,
    zIndex: 25,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: { fontSize: 12, fontWeight: "600" },
});
