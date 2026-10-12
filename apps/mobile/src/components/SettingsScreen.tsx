import React from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Theme } from "../theme";
import { Icon, IconName } from "./Icon";
type Props = {
  theme: Theme;
  isDark: boolean;
  onToggleDark: (value: boolean) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: (value: boolean) => void;
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
}: {
  theme: Theme;
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.row, { borderColor: theme.line }]}>
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
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.accent, false: theme.line }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
export function SettingsScreen({
  theme,
  isDark,
  onToggleDark,
  reducedMotion,
  onToggleReducedMotion,
  stepFree,
  onToggleStepFree,
}: Props) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: theme.muted }]}>
          MAKE IT YOURS
        </Text>
        <Text style={[styles.title, { color: theme.ink }]}>
          Your preferences
        </Text>
        <Text style={[styles.description, { color: theme.muted }]}>
          A more comfortable way around.
        </Text>
      </View>
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>
        NAVIGATION
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.paper, borderColor: theme.line },
        ]}
      >
        <Preference
          theme={theme}
          icon="accessibility"
          title="Step-free routes"
          description="Use lifts when moving between floors."
          value={stepFree}
          onChange={onToggleStepFree}
        />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>
        APPEARANCE
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.paper, borderColor: theme.line },
        ]}
      >
        <Preference
          theme={theme}
          icon="moon"
          title="Dark appearance"
          description="Softer surfaces for low light."
          value={isDark}
          onChange={onToggleDark}
        />
        <Preference
          theme={theme}
          icon="layers"
          title="Reduced motion"
          description="Limit camera and screen animations."
          value={reducedMotion}
          onChange={onToggleReducedMotion}
        />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>
        YOUR VENUE
      </Text>
      <View
        style={[
          styles.venue,
          { backgroundColor: theme.paper, borderColor: theme.line },
        ]}
      >
        <Icon name="map" color={theme.accent} size={28} />
        <Text style={[styles.rowTitle, { color: theme.ink }]}>
          Sandton City demo
        </Text>
        <Text style={[styles.description, { color: theme.muted }]}>
          The illustrative floor network and directory are included in the app.
          Outdoor map tiles depend on the map provider.
        </Text>
        <View style={[styles.included, { backgroundColor: theme.accentSoft }]}>
          <Icon name="check" color={theme.accent} size={16} />
          <Text style={{ color: theme.accent, fontSize: 12 }}>
            2 floors included
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.rowTitle, { color: theme.ink }]}>atlas</Text>
        <Text style={[styles.description, { color: theme.muted }]}>
          Mobile navigation · v0.1.0
        </Text>
        <Text style={[styles.note, { color: theme.muted }]}>
          Demo positioning. No live sensor tracking or diagnostics are active.
          Preferences apply to this app session.
        </Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 24, paddingBottom: 112, gap: 16 },
  header: { gap: 8, marginBottom: 16 },
  eyebrow: { fontSize: 12, fontWeight: "600", letterSpacing: 1 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: "600", letterSpacing: -1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  row: {
    minHeight: 100,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  description: { fontSize: 16, lineHeight: 20 },
  venue: { padding: 24, gap: 12, borderRadius: 24, borderWidth: 1 },
  included: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  footer: { alignItems: "center", gap: 8, paddingTop: 16 },
  note: { fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 320 },
});
