import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, shadows } from "../theme";
import { Icon } from "./Icon";
export function FloatingSearchBar({
  theme,
  onPress,
  value = "",
}: {
  theme: Theme;
  onPress: () => void;
  value?: string;
}) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.header}>
        <View style={styles.brand}>
          <Icon name="compass" color={theme.accent} size={28} />
          <Text style={[styles.wordmark, { color: theme.ink }]}>atlas</Text>
        </View>
        <View style={[styles.demo, { backgroundColor: theme.paper }]}>
          <Text style={[styles.demoText, { color: theme.inkSecondary }]}>
            Demo venue
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search destinations"
        onPress={onPress}
        style={({ pressed }) => [
          styles.search,
          shadows.soft,
          {
            backgroundColor: theme.paper,
            borderColor: theme.cardBorder,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Icon name="search" color={theme.accent} />
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.ink }]}>
            {value || "Where to?"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Shops, food & facilities
          </Text>
        </View>
        <View style={[styles.arrow, { backgroundColor: theme.subtle }]}>
          <Icon name="arrow" size={18} color={theme.inkSecondary} />
        </View>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 12,
    left: 20,
    right: 20,
    zIndex: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { flexDirection: "row", gap: 6, alignItems: "center" },
  wordmark: { fontSize: 32, fontWeight: "600", letterSpacing: -1.2 },
  demo: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  demoText: { fontSize: 12, fontWeight: "600" },
  search: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: "600" },
  subtitle: { fontSize: 12 },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
