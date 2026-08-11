import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { radius, shadows, space, Theme } from "../theme";

type Props = {
  theme: Theme;
  isDark: boolean;
  onToggleDark: (value: boolean) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: (value: boolean) => void;
};

export function SettingsScreen({ theme, isDark, onToggleDark, reducedMotion, onToggleReducedMotion }: Props) {
  // Settings state
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [preferLifts, setPreferLifts] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [shareQualityData, setShareQualityData] = useState(true);
  const [offlineMapDownloaded, setOfflineMapDownloaded] = useState(true);

  const dark = theme.isDark;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title Header */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>PREFERENCES</Text>
          <Text style={[styles.title, { color: theme.ink }]}>Settings</Text>
        </View>

        {/* SECTION 1: ROUTING & ACCESSIBILITY */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.inkSecondary }]}>
            ROUTE ACCESSIBILITY
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: dark ? theme.card : "#FFFFFF", borderColor: theme.cardBorder },
              shadows.soft,
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  Avoid stairs & escalators
                </Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  Calculates step-free routes suitable for strollers and wheelchairs
                </Text>
              </View>
              <Switch
                accessibilityLabel="Avoid stairs and escalators"
                value={avoidStairs}
                onValueChange={setAvoidStairs}
                trackColor={{ true: theme.accent, false: theme.line }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.line }]} />

            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  Prefer lifts & ramps
                </Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  Prioritizes elevator transition cores when moving between levels
                </Text>
              </View>
              <Switch
                accessibilityLabel="Prefer lifts and ramps"
                value={preferLifts}
                onValueChange={setPreferLifts}
                trackColor={{ true: theme.accent, false: theme.line }}
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: APPEARANCE & VOICE GUIDANCE */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.inkSecondary }]}>
            APPEARANCE & VOICE
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: dark ? theme.card : "#FFFFFF", borderColor: theme.cardBorder },
              shadows.soft,
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  Dark appearance
                </Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  Adapts map colors and interface for low light environments
                </Text>
              </View>
              <Switch
                accessibilityLabel="Dark appearance"
                value={isDark}
                onValueChange={onToggleDark}
                trackColor={{ true: theme.accent, false: theme.line }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.line }]} />

            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  Voice turn guidance
                </Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  Spoken directions as you approach turns and floor transitions
                </Text>
              </View>
              <Switch
                accessibilityLabel="Voice turn guidance"
                value={voiceGuidance}
                onValueChange={setVoiceGuidance}
                trackColor={{ true: theme.accent, false: theme.line }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.line }]} />

            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  Reduced motion
                </Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  Minimizes map zoom and transition animations
                </Text>
              </View>
              <Switch
                accessibilityLabel="Reduced motion"
                value={reducedMotion}
                onValueChange={onToggleReducedMotion}
                trackColor={{ true: theme.accent, false: theme.line }}
              />
            </View>
          </View>
        </View>

        {/* SECTION 3: PRIVACY & POSITIONING PERMISSIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.inkSecondary }]}>
            PRIVACY & PERMISSIONS
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: dark ? theme.card : "#FFFFFF", borderColor: theme.cardBorder },
              shadows.soft,
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  Indoor positioning signals
                </Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  Uses BLE beacons and motion sensors solely to place you on the map
                </Text>
              </View>
              <Text style={[styles.statusTag, { color: theme.emerald }]}>
                Granted
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.line }]} />

            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  Anonymous quality diagnostics
                </Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  Helps improve indoor map accuracy without linking to device IDs
                </Text>
              </View>
              <Switch
                accessibilityLabel="Anonymous quality diagnostics"
                value={shareQualityData}
                onValueChange={setShareQualityData}
                trackColor={{ true: theme.accent, false: theme.line }}
              />
            </View>
          </View>
        </View>

        {/* SECTION 4: OFFLINE VENUE MAPS */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.inkSecondary }]}>
            OFFLINE VENUE MAPS
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: dark ? theme.card : "#FFFFFF", borderColor: theme.cardBorder },
              shadows.soft,
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  Sandton City Map
                </Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  32 MB • Version 1.2 • 2 Floors cached
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle offline map download"
                onPress={() => setOfflineMapDownloaded(!offlineMapDownloaded)}
                style={({ pressed }) => [
                  styles.downloadBtn,
                  {
                    backgroundColor: offlineMapDownloaded
                      ? dark
                        ? "rgba(16, 185, 129, 0.2)"
                        : "#ECFDF5"
                      : theme.subtle,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.downloadText,
                    { color: offlineMapDownloaded ? theme.emerald : theme.ink },
                  ]}
                >
                  {offlineMapDownloaded ? "✓ Saved" : "Download"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* App Version Info Footer */}
        <View style={styles.footer}>
          <Text style={[styles.appTitle, { color: theme.ink }]}>Atlas Navigation v1.0.0</Text>
          <Text style={[styles.appMeta, { color: theme.muted }]}>
            Indoor Spatial Platform • Schema V1 Compliant
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: space.xl,
    paddingBottom: 100,
    gap: space.lg,
  },
  header: {
    gap: 2,
    marginTop: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowTextGroup: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  rowSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  statusTag: {
    fontSize: 13,
    fontWeight: "700",
  },
  downloadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  downloadText: {
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
    gap: 2,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  appMeta: {
    fontSize: 11,
  },
});
