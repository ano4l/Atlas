import React, { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Theme } from "../theme";
import { useFeedback, MotionPressable } from "./Motion";
import { radius, space, textSize } from "../theme";

export function CheckpointScanner({ foreground, onClose, onScan, theme }: {
  foreground: boolean;
  onClose: () => void;
  onScan: (code: string) => boolean;
  theme: Theme;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState(false);
  const [invalidCode, setInvalidCode] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const scanned = useRef(false);
  const lastCode = useRef<string | null>(null);
  const feedback = useFeedback();

  async function allowCamera() {
    setRequesting(true);
    try {
      await requestPermission();
    } catch {
      setCameraError(true);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <Modal onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
        <Text accessibilityRole="header" style={[styles.heading, { color: theme.ink }]}>Scan checkpoint</Text>
        <Text style={{ color: theme.inkSecondary }}>Point the camera at a printed checkpoint for this fictional map.</Text>
        {foreground && permission?.granted && !cameraError && (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onMountError={() => setCameraError(true)}
            onBarcodeScanned={({ data }) => {
              if (scanned.current || lastCode.current === data) return;
              lastCode.current = data;
              scanned.current = onScan(data);
              setInvalidCode(!scanned.current);
              feedback(scanned.current ? "success" : "error");
            }}
          />
        )}
        {invalidCode && !cameraError && (
          <Text accessibilityRole="alert" style={{ color: theme.danger }}>
            This code does not match an entrance on the current map. Try another checkpoint.
          </Text>
        )}
        {cameraError || permission?.canAskAgain === false && !permission.granted ? (
          <Text accessibilityRole="alert" style={{ color: theme.danger }}>
            Camera access is unavailable. Close the scanner to choose an entrance.
          </Text>
        ) : permission && !permission.granted ? (
          <MotionPressable accessibilityRole="button" accessibilityState={{ disabled: requesting }} disabled={requesting}
            style={[styles.button, { borderColor: theme.line }]} onPress={() => void allowCamera()}>
            <Text style={{ color: theme.ink }}>{requesting ? "Requesting camera access…" : "Allow camera access"}</Text>
          </MotionPressable>
        ) : null}
        <MotionPressable accessibilityRole="button" style={[styles.button, { borderColor: theme.line }]} onPress={onClose}>
          <Text style={{ color: theme.ink }}>Close scanner</Text>
        </MotionPressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: space.xl, gap: space.lg },
  heading: { fontSize: textSize.heading, fontWeight: "700" },
  camera: { flex: 1, minHeight: 160, backgroundColor: "#000" },
  button: { minHeight: 48, paddingHorizontal: space.lg, justifyContent: "center", borderWidth: 1, borderRadius: radius.md },
});
