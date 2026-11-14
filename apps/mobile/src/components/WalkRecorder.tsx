import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Accelerometer, Barometer, DeviceMotion } from "expo-sensors";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { MAX_REPLAY_MARKS, startRecording, type ReplayFixture } from "@atlas/positioning-core";
import { readAcceleration, readDeviceMotion, readPressure } from "../positioning/native-readings";
import type { Theme } from "../theme";

const RECORDING_MS = 180000;
const SAMPLE_LIMIT = 8000;
type Carrying = "handheld" | "pocket";

export function WalkRecorder({ theme }: { theme: Theme }) {
  const [carrying, setCarrying] = useState<Carrying>("handheld");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [samples, setSamples] = useState(0);
  const [marks, setMarks] = useState(0);
  const [capture, setCapture] = useState<ReplayFixture | null>(null);
  const [message, setMessage] = useState("");
  const pending = useRef<AbortController | null>(null);
  const stopActive = useRef<((retain: boolean, reason?: string) => void) | null>(null);
  const activeRecorder = useRef<ReturnType<typeof startRecording> | null>(null);
  const sharing = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") stopActive.current?.(true, "Recording stopped when Atlas left the foreground.");
    });
    return () => {
      mounted.current = false;
      pending.current?.abort();
      stopActive.current?.(false);
      appState.remove();
    };
  }, []);

  async function begin() {
    if (pending.current || stopActive.current || sharing.current) return;
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      setMessage("Walk recording is available on iOS and Android.");
      return;
    }
    const request = new AbortController();
    pending.current = request;
    setBusy(true);
    setMessage("");
    const subscriptions: Array<{ remove: () => void }> = [];
    try {
      const [deviceMotionAvailable, accelerometerAvailable, pressureAvailable] = await Promise.all([
        DeviceMotion.isAvailableAsync().catch(() => false),
        Accelerometer.isAvailableAsync().catch(() => false),
        Barometer.isAvailableAsync().catch(() => false),
      ]);
      if (request.signal.aborted) return;
      if (!deviceMotionAvailable && !accelerometerAvailable) {
        setMessage("This device does not provide accelerometer readings.");
        return;
      }
      let permission = await DeviceMotion.getPermissionsAsync();
      if (!request.signal.aborted && !permission.granted && permission.canAskAgain) {
        permission = await DeviceMotion.requestPermissionsAsync();
      }
      if (request.signal.aborted) return;
      if (!permission.granted) {
        setMessage("Allow motion access in device settings to record a walk.");
        return;
      }
      if (AppState.currentState !== "active") {
        setMessage("Return to Atlas and start the recording again.");
        return;
      }

      const startedAt = new Date().toISOString();
      const recorder = startRecording({
        fixtureId: `walk-${startedAt}`,
        venueId: "unmapped-walk",
        mapVersionId: null,
        startedAt,
        seed: 0,
        device: {
          platform: Platform.OS, carrying, timestampBasis: "receipt",
          motionSource: deviceMotionAvailable ? "device-motion" : "accelerometer",
        },
      }, () => performance.now(), SAMPLE_LIMIT);

      let motionSamples = 0;
      let count = 0;
      let timer: ReturnType<typeof setInterval> | undefined;
      const startTime = performance.now();
      const finish = (retain: boolean, reason = "") => {
        if (stopActive.current !== finish) return;
        stopActive.current = null;
        activeRecorder.current = null;
        if (timer !== undefined) clearInterval(timer);
        for (const subscription of subscriptions) subscription.remove();
        const finished = recorder.stop();
        if (!retain) return;
        setRecording(false);
        setSamples(finished.observations.length);
        if (motionSamples) setCapture(finished);
        setMessage(motionSamples ? reason : "No accelerometer readings arrived. Try again on a supported device.");
      };

      const recordMotion = (reading: ReturnType<typeof readAcceleration>) => {
        if (reading && recorder.record(reading)) {
          motionSamples++;
          count++;
        }
      };
      if (deviceMotionAvailable) {
        DeviceMotion.setUpdateInterval(40);
        subscriptions.push(DeviceMotion.addListener((sample) => recordMotion(readDeviceMotion(sample))));
      } else {
        Accelerometer.setUpdateInterval(40);
        subscriptions.push(Accelerometer.addListener((sample) => recordMotion(readAcceleration(sample))));
      }
      if (pressureAvailable) {
        try {
          Barometer.setUpdateInterval(200);
          subscriptions.push(Barometer.addListener((sample) => {
            const reading = readPressure(sample);
            if (reading && recorder.record(reading)) count++;
          }));
        } catch {
          // Accelerometer recording can continue without pressure readings.
        }
      }
      stopActive.current = finish;
      activeRecorder.current = recorder;
      timer = setInterval(() => {
        setSamples(count);
        const elapsed = performance.now() - startTime;
        if (!motionSamples && elapsed >= 5000) finish(true);
        else if (elapsed >= RECORDING_MS || count >= SAMPLE_LIMIT) finish(true, "Recording reached its limit.");
      }, 500);
      setSamples(0);
      setMarks(0);
      setRecording(true);
    } catch {
      for (const subscription of subscriptions) subscription.remove();
      if (!request.signal.aborted) setMessage("Atlas could not start motion recording.");
    } finally {
      if (pending.current === request) pending.current = null;
      if (!request.signal.aborted) setBusy(false);
    }
  }

  async function exportCapture() {
    if (!capture || sharing.current) return;
    sharing.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (!(await Sharing.isAvailableAsync())) {
        if (mounted.current) setMessage("File sharing is unavailable on this device.");
        return;
      }
      if (!mounted.current) return;
      const file = new File(Paths.cache, "atlas-walk-replay.json");
      file.create({ overwrite: true });
      file.write(JSON.stringify(capture));
      // The receiving app can read the attachment after the share sheet closes.
      await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json" });
    } catch {
      if (mounted.current) setMessage("Atlas could not export the recording. Try again.");
    } finally {
      sharing.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.heading, { color: theme.ink }]}>Walk recorder</Text>
      <View style={[styles.card, { backgroundColor: theme.paper, borderColor: theme.line }]}>
        <Text style={[styles.copy, { color: theme.muted }]}>
          Record motion for up to 3 minutes. Keep Atlas open and export the replay before leaving Settings.
        </Text>
        <View style={styles.actions}>
          {(["handheld", "pocket"] as const).map((value) => (
            <Action key={value} theme={theme} disabled={busy || recording} selected={value === carrying}
              label={value === "handheld" ? "In hand" : "In pocket"} onPress={() => setCarrying(value)} />
          ))}
        </View>
        <View style={styles.actions}>
          {recording ? (
            <>
              <Action theme={theme} label="Mark checkpoint" disabled={marks >= MAX_REPLAY_MARKS} onPress={() => {
                const number = activeRecorder.current?.markCheckpoint();
                if (number != null) setMarks(number);
              }} />
              <Action theme={theme} label="Stop recording" onPress={() => stopActive.current?.(true)} />
            </>
          ) : (
            <Action theme={theme} label="Start recording" disabled={busy} onPress={() => void begin()} />
          )}
          {!recording && capture && (
            <Action theme={theme} label="Export replay" disabled={busy} onPress={() => void exportCapture()} />
          )}
        </View>
        {recording && <Text style={[styles.copy, { color: theme.ink }]}>Recording · {samples} readings</Text>}
        {recording && marks > 0 && (
          <Text accessibilityLiveRegion="polite" style={[styles.copy, { color: theme.ink }]}>
            Checkpoint {marks} marked
          </Text>
        )}
        {!recording && capture && (
          <Text style={[styles.copy, { color: theme.ink }]}>
            Replay ready · {capture.observations.length} readings · {capture.marks?.length ?? 0} checkpoints
          </Text>
        )}
        {!!message && <Text accessibilityLiveRegion="polite" style={[styles.copy, { color: theme.ink }]}>{message}</Text>}
      </View>
    </View>
  );
}

function Action({ theme, label, onPress, selected, disabled }: {
  theme: Theme;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled}
      onPress={onPress} style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed || selected ? theme.accentSoft : theme.subtle, opacity: disabled ? 0.5 : 1 },
      ]}>
      <Text style={{ color: theme.ink, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: "700", paddingHorizontal: 4 },
  card: { gap: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  copy: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12 },
});
