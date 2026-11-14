import React from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { atlasSandtonVenue } from "../fixtures";
import { Theme } from "../theme";
import { Icon, IconName } from "./Icon";
import { WalkRecorder } from "./WalkRecorder";
import { NavigationDiagnostics } from "./NavigationDiagnostics";
import { radius, space, textSize } from "../theme";

type Props = {
  theme: Theme;
  isDark: boolean;
  onToggleDark: (value: boolean) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: (value: boolean) => void;
  systemReducedMotion: boolean;
  haptics: boolean;
  onToggleHaptics: (value: boolean) => void;
  stepFree: boolean;
  onToggleStepFree: (value: boolean) => void;
};

function Preference({
  theme,
  icon,
  title,
  description,
  value,
  onChange,
  disabled = false,
}: {
  theme: Theme;
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={icon} color={theme.accent} size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.rowTitle, { color: theme.ink }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.muted }]}>
          {description}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityHint={description}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        hitSlop={8}
        trackColor={{ true: theme.primary, false: theme.muted }}
        ios_backgroundColor={theme.muted}
        thumbColor={theme.isDark ? theme.primaryText : "#FFFFFF"}
      />
    </View>
  );
}

export function SettingsScreen({
  theme,
  isDark,
  onToggleDark,
  reducedMotion,
  systemReducedMotion,
  haptics,
  onToggleHaptics,
  onToggleReducedMotion,
  stepFree,
  onToggleStepFree,
}: Props) {
  const cardColors = { backgroundColor: theme.paper, borderColor: theme.line };
  const dividerColor = { backgroundColor: theme.line };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.ink }]}
        >
          Settings
        </Text>
        <Text style={[styles.subtitle, { color: theme.inkSecondary }]}>
          Adjust the map and walking directions.
        </Text>
      </View>

      <View style={styles.section}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: theme.ink }]}
        >
          Walking directions
        </Text>
        <View style={[styles.card, cardColors]}>
          <Preference
            theme={theme}
            icon="accessibility"
            title="Prefer step-free routes"
            description="Use lifts when a route changes floors. Step-free access at this venue is unverified."
            value={stepFree}
            onChange={onToggleStepFree}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: theme.ink }]}
        >
          Display and feedback
        </Text>
        <View style={[styles.card, cardColors]}>
          <Preference
            theme={theme}
            icon="moon"
            title="Dark mode"
            description="Use a darker map and interface."
            value={isDark}
            onChange={onToggleDark}
          />
          <View style={[styles.divider, dividerColor]} />
          <Preference
            theme={theme}
            icon="layers"
            title="Reduce motion"
            description={
              systemReducedMotion
                ? "Enabled in your device accessibility settings."
                : "Limit map movement and interface animations."
            }
            disabled={systemReducedMotion}
            value={reducedMotion}
            onChange={onToggleReducedMotion}
          />
          <View style={[styles.divider, dividerColor]} />
          <Preference
            theme={theme}
            icon="locate"
            title="Haptic feedback"
            description="Feel a tap when saving a place or arriving."
            value={haptics}
            onChange={onToggleHaptics}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: theme.ink }]}
        >
          About this map
        </Text>
        <View style={[styles.card, cardColors]}>
          <View style={[styles.row, styles.aboutRow]}>
            <View style={[styles.icon, { backgroundColor: theme.subtle }]}>
              <Icon name="map" color={theme.inkSecondary} size={20} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, { color: theme.ink }]}>
                {atlasSandtonVenue.venueName} · Indoor demo
              </Text>
              <Text style={[styles.description, { color: theme.muted }]}>
                Routes use a reference floor plan and a simulated starting
                position. Store entrances and lifts are unverified.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {(__DEV__ || process.env.EXPO_PUBLIC_ATLAS_WALK_RECORDER === "1") && <WalkRecorder theme={theme} />}
      {Boolean(process.env.EXPO_PUBLIC_ATLAS_API_URL?.trim()) && <NavigationDiagnostics theme={theme} />}

      <View style={[styles.footer, { borderColor: theme.line }]}>
        <Text style={[styles.rowTitle, { color: theme.ink }]}>
          Atlas · v0.1.0
        </Text>
        <Text style={[styles.description, { color: theme.muted }]}>
          Preferences apply to this session. Saved and recent places are stored
          on this device.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    gap: space.xxl,
  },
  header: { gap: space.sm },
  title: {
    fontSize: textSize.display,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  subtitle: { fontSize: textSize.body, lineHeight: 24 },
  section: { gap: space.sm },
  sectionTitle: {
    fontSize: textSize.body,
    lineHeight: 22,
    fontWeight: "700",
    paddingHorizontal: space.xs,
  },
  card: { borderRadius: radius.lg, borderWidth: 1 },
  row: {
    minHeight: 72,
    padding: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  aboutRow: { alignItems: "flex-start", paddingVertical: space.lg },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: space.xs },
  rowTitle: { fontSize: textSize.body, lineHeight: 22, fontWeight: "700" },
  description: { fontSize: textSize.subhead, lineHeight: 20 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
    marginRight: space.md,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.lg,
    paddingHorizontal: space.xs,
    gap: space.xs,
  },
});
