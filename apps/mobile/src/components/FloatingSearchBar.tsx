import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { radius, shadows, Theme } from "../theme";

type Props = {
  theme: Theme;
  onPress: () => void;
  value?: string;
  onVoicePress?: () => void;
};

export function FloatingSearchBar({
  theme,
  onPress,
  value = "",
  onVoicePress,
}: Props) {
  const dark = theme.isDark;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Where do you want to go? Search destinations"
        onPress={onPress}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: dark ? "rgba(30,32,36,0.94)" : "rgba(255,255,255,0.94)",
            borderColor: theme.cardBorder,
            opacity: pressed ? 0.92 : 1,
          },
          shadows.medium,
        ]}
      >
        {/* Search Icon */}
        <View style={styles.searchIconWrapper}>
          <Text style={[styles.searchIcon, { color: theme.ink }]}>🔍</Text>
        </View>

        {/* Search Input Text */}
        <Text
          numberOfLines={1}
          style={[
            styles.placeholderText,
            { color: value ? theme.ink : theme.muted },
          ]}
        >
          {value || "Where do you want to go?"}
        </Text>

        {/* Microphone Voice Search Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voice search"
          onPress={onVoicePress ?? onPress}
          style={({ pressed }) => [
            styles.micButton,
            {
              backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#F4F3ED",
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={[styles.micIcon, { color: theme.ink }]}>🎙️</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  pill: {
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  searchIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    fontSize: 16,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  micIcon: {
    fontSize: 16,
  },
});
