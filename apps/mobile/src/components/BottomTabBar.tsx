import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, shadows, Theme } from "../theme";

export type TabKey = "map" | "explore" | "settings";

type Props = {
  theme: Theme;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
};

export function BottomTabBar({ theme, activeTab, onTabChange }: Props) {
  const dark = theme.isDark;

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "map", label: "Map", icon: "🗺️" },
    { key: "explore", label: "Explore", icon: "🧭" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: dark
              ? "rgba(30, 32, 36, 0.94)"
              : "rgba(255, 255, 255, 0.94)",
            borderColor: theme.cardBorder,
          },
          shadows.medium,
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Navigate to ${tab.label} tab`}
              onPress={() => onTabChange(tab.key)}
              style={({ pressed }) => [
                styles.tabItem,
                isActive && {
                  backgroundColor: dark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(17, 17, 17, 0.06)",
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.tabIcon,
                  {
                    color: isActive ? theme.ink : theme.muted,
                    opacity: isActive ? 1 : 0.7,
                  },
                ]}
              >
                {tab.key === "map" ? "⌁" : tab.key === "explore" ? "◎" : "≡"}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.ink : theme.muted,
                    fontWeight: isActive ? "800" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 25,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 380,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "600",
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
});
