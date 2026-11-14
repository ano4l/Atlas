import React, { useState, useSyncExternalStore } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import { DIAGNOSTIC_LIMIT, navigationDiagnostics } from "../map/navigation-diagnostics";
import type { Theme } from "../theme";

import { MotionPressable } from "./Motion";
import { radius, space, textSize } from "../theme";
export function NavigationDiagnostics({ theme }: { theme: Theme }) {
  const { recording, entries } = useSyncExternalStore(navigationDiagnostics.subscribe, navigationDiagnostics.getSnapshot);
  const [sharing, setSharing] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);

  async function shareReport() {
    const message = navigationDiagnostics.exportReport();
    if (!message || sharing) return;
    setSharing(true);
    setShareFailed(false);
    try {
      await Share.share({ title: "Atlas navigation diagnostics", message });
    } catch {
      setShareFailed(true);
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.heading, { color: theme.ink }]}>Navigation diagnostics</Text>
      <View style={[styles.card, { backgroundColor: theme.paper, borderColor: theme.line }]}>
        <Text style={{ color: theme.inkSecondary }}>
          Keep up to {DIAGNOSTIC_LIMIT} test venue failures and offline fallbacks in memory for 30 minutes. Share the report only when you choose.
        </Text>
        <Text accessibilityLiveRegion="polite" style={{ color: theme.muted }}>
          {recording ? "Recording" : "Recording off"} · {entries.length} {entries.length === 1 ? "event" : "events"}
        </Text>
        <MotionPressable accessibilityRole="button" style={[styles.button, { backgroundColor: theme.accentSoft }]}
          onPress={() => {
            setShareFailed(false);
            if (recording) navigationDiagnostics.stop();
            else navigationDiagnostics.start();
          }}>
          <Text style={[styles.label, { color: theme.accent }]}>
            {recording ? "Stop recording" : entries.length ? "Start new recording" : "Start recording"}
          </Text>
        </MotionPressable>
        {(entries.length > 0 || recording) && (
          <MotionPressable accessibilityRole="button" style={styles.button} onPress={() => {
            navigationDiagnostics.clear();
            setShareFailed(false);
          }}>
            <Text style={[styles.label, { color: theme.ink }]}>Clear report</Text>
          </MotionPressable>
        )}
        {entries.length > 0 && (
          <MotionPressable accessibilityRole="button" accessibilityState={{ disabled: sharing }} disabled={sharing}
            style={styles.button} onPress={() => void shareReport()}>
            <Text style={[styles.label, { color: theme.accent }]}>Share report</Text>
          </MotionPressable>
        )}
        {shareFailed && <Text accessibilityRole="alert" style={{ color: theme.danger }}>The report couldn’t be shared. Try again.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  heading: { fontSize: textSize.body, lineHeight: 22, fontWeight: "700", paddingHorizontal: space.xs },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  button: { minHeight: 48, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, justifyContent: "center" },
  label: { fontWeight: "600" },
});
