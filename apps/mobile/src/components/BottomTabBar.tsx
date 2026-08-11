import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, shadows, Theme } from "../theme";

export type TabKey = "map" | "explore" | "settings";
type Props = { theme: Theme; activeTab: TabKey; onTabChange: (tab: TabKey) => void };

function TabIcon({ name, color }: { name: TabKey; color: string }) {
  if (name === "map") return <View style={styles.iconFrame}><View style={[styles.mapFold, { borderColor: color }]} /><View style={[styles.mapLine, { backgroundColor: color }]} /></View>;
  if (name === "explore") return <View style={styles.iconFrame}><View style={[styles.compassRing, { borderColor: color }]} /><View style={[styles.compassNeedle, { borderBottomColor: color }]} /></View>;
  return <View style={styles.iconFrame}><View style={[styles.settingsLine, { backgroundColor: color }]} /><View style={[styles.settingsLine, styles.settingsMiddle, { backgroundColor: color }]} /><View style={[styles.settingsLine, { backgroundColor: color }]} /></View>;
}

export function BottomTabBar({ theme, activeTab, onTabChange }: Props) {
  const tabs: { key: TabKey; label: string }[] = [{ key: "map", label: "Map" }, { key: "explore", label: "Explore" }, { key: "settings", label: "Settings" }];
  return <View style={styles.wrapper} pointerEvents="box-none"><View style={[styles.bar, { backgroundColor: theme.isDark ? "rgba(29,31,35,0.96)" : "rgba(255,255,255,0.96)", borderColor: theme.cardBorder }, shadows.medium]}>
    {tabs.map((tab) => { const active = activeTab === tab.key; const color = active ? theme.ink : theme.muted; return <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={`${tab.label} tab`} onPress={() => onTabChange(tab.key)}
      style={({ pressed }) => [styles.tab, active && { backgroundColor: theme.subtle }, pressed && { opacity: 0.72 }]}>
      <TabIcon name={tab.key} color={color} /><Text style={[styles.label, { color, fontWeight: active ? "700" : "500" }]}>{tab.label}</Text>
    </Pressable>; })}
  </View></View>;
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", bottom: 22, left: 18, right: 18, zIndex: 25, alignItems: "center" },
  bar: { flexDirection: "row", alignItems: "center", width: "100%", maxWidth: 380, height: 66, borderRadius: radius.pill, borderWidth: 1, padding: 7 },
  tab: { flex: 1, height: 52, borderRadius: 22, alignItems: "center", justifyContent: "center", gap: 3 },
  label: { fontSize: 10.5, letterSpacing: 0 },
  iconFrame: { width: 22, height: 19, alignItems: "center", justifyContent: "center", gap: 3 },
  mapFold: { width: 17, height: 14, borderWidth: 1.5, borderRadius: 3, transform: [{ skewY: "-8deg" }] },
  mapLine: { position: "absolute", width: 1.5, height: 12, borderRadius: 1 },
  compassRing: { width: 17, height: 17, borderWidth: 1.5, borderRadius: 9 },
  compassNeedle: { position: "absolute", width: 0, height: 0, borderLeftWidth: 3.5, borderRightWidth: 3.5, borderBottomWidth: 9, borderLeftColor: "transparent", borderRightColor: "transparent", transform: [{ rotate: "32deg" }] },
  settingsLine: { width: 18, height: 1.5, borderRadius: 1 },
  settingsMiddle: { width: 13, marginLeft: 5 },
});
