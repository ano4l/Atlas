import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, shadows, Theme } from "../theme";

type Props = { theme: Theme; onPress: () => void; value?: string; onVoicePress?: () => void };

export function FloatingSearchBar({ theme, onPress, value = "", onVoicePress }: Props) {
  const surface = theme.isDark ? "rgba(30,32,36,0.95)" : "rgba(255,255,255,0.96)";
  return <View style={styles.container} pointerEvents="box-none">
    <Pressable accessibilityRole="button" accessibilityLabel="Search destinations" onPress={onPress}
      style={({ pressed }) => [styles.pill, { backgroundColor: surface, borderColor: theme.cardBorder, opacity: pressed ? 0.92 : 1 }, shadows.medium]}>
      <View style={styles.searchIcon}><View style={[styles.searchRing, { borderColor: theme.ink }]} /><View style={[styles.searchHandle, { backgroundColor: theme.ink }]} /></View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.placeholder, { color: value ? theme.ink : theme.muted }]}>{value || "Where do you want to go?"}</Text>
        {!value && <Text style={[styles.context, { color: theme.muted }]}>Search this venue</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Voice search" onPress={onVoicePress ?? onPress}
        style={({ pressed }) => [styles.voice, { backgroundColor: theme.subtle, opacity: pressed ? 0.72 : 1 }]}>
        <View style={[styles.micCapsule, { borderColor: theme.ink }]} /><View style={[styles.micStem, { backgroundColor: theme.ink }]} />
      </Pressable>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 54, left: 16, right: 16, zIndex: 20 },
  pill: { height: 62, borderRadius: radius.pill, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 17, gap: 13 },
  searchIcon: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  searchRing: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.8, marginLeft: -3, marginTop: -3 },
  searchHandle: { width: 7, height: 1.8, borderRadius: 1, position: "absolute", right: 1, bottom: 4, transform: [{ rotate: "45deg" }] },
  copy: { flex: 1, justifyContent: "center", gap: 1 },
  placeholder: { fontSize: 16, lineHeight: 20, fontWeight: "650" as "600", letterSpacing: -0.25 },
  context: { fontSize: 10, lineHeight: 13, fontWeight: "600", letterSpacing: 0.1 },
  voice: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  micCapsule: { width: 9, height: 14, borderRadius: 5, borderWidth: 1.5, marginTop: -3 },
  micStem: { width: 1.5, height: 6, position: "absolute", bottom: 7, borderRadius: 1 },
});
