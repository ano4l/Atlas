import React, { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ActiveNavigationPanel,
  BottomTabBar,
  DestinationSheet,
  ExploreScreen,
  FloatingMapControls,
  FloatingSearchBar,
  IndoorMap,
  SearchOverlay,
  SettingsScreen,
} from "./src/components";
import { FeedbackContext, useFeedback } from "./src/components/Motion";
import { usePlaceMemory } from "./src/usePlaceMemory";
import { CameraMode } from "./src/map/camera";
import { Icon } from "./src/components/Icon";
import { TabKey } from "./src/components/BottomTabBar";
import { atlasSandtonVenue, samplePOIs } from "./src/fixtures";
import { POIItem } from "./src/map/types";
import { buildDemoRoute } from "./src/map/demo-routing";
import { darkTheme, lightTheme, shadows } from "./src/theme";

export default function App() {
  const [systemReducedMotion, setSystemReducedMotion] = useState(true);
  const [limitMotion, setLimitMotion] = useState(false);
  const [haptics, setHaptics] = useState(true);
  return (
    <FeedbackContext.Provider
      value={{ reducedMotion: systemReducedMotion || limitMotion, haptics }}
    >
      <AtlasApp
        systemReducedMotion={systemReducedMotion}
        setSystemReducedMotion={setSystemReducedMotion}
        limitMotion={limitMotion}
        setLimitMotion={setLimitMotion}
        haptics={haptics}
        setHaptics={setHaptics}
      />
    </FeedbackContext.Provider>
  );
}
function AtlasApp({
  systemReducedMotion,
  setSystemReducedMotion,
  limitMotion,
  setLimitMotion,
  haptics,
  setHaptics,
}: {
  systemReducedMotion: boolean;
  setSystemReducedMotion: (value: boolean) => void;
  limitMotion: boolean;
  setLimitMotion: (value: boolean) => void;
  haptics: boolean;
  setHaptics: (value: boolean) => void;
}) {
  const places = usePlaceMemory();
  const feedback = useFeedback();
  const [cameraMode, setCameraMode] = useState<CameraMode>("floor");
  const [sheetHeight, setSheetHeight] = useState(300);
  const [instructionHeight, setInstructionHeight] = useState(108);
  const [activeTab, setActiveTab] = useState<TabKey>("map");
  const [isDark, setIsDark] = useState(false);
  const [floorLevel, setFloorLevel] = useState(1);
  const [recenterKey, setRecenterKey] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null);
  const reducedMotion = systemReducedMotion || limitMotion;
  const [stepFree, setStepFree] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [arrived, setArrived] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;
  const route = useMemo(
    () => (selectedPOI ? buildDemoRoute(selectedPOI, stepFree) : null),
    [selectedPOI, stepFree],
  );
  const currentStep = isNavigating ? route?.steps[currentStepIndex] : undefined;
  const position =
    arrived && selectedPOI
      ? selectedPOI.point
      : (currentStep?.nodePoint ?? atlasSandtonVenue.start);
  const positionFloor =
    arrived && selectedPOI
      ? selectedPOI.floorLevel
      : (currentStep?.floorLevel ?? atlasSandtonVenue.startFloorLevel);
  const closeDestination = () => {
    setSelectedPOI(null);
    setIsNavigating(false);
    setArrived(false);
    setFloorLevel(1);
    setCameraMode("floor");
  };
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSystemReducedMotion)
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemReducedMotion,
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (selectedPOI && activeTab === "map") {
          closeDestination();
          return true;
        }
        if (activeTab !== "map") {
          setActiveTab("map");
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [selectedPOI, activeTab]);
  const selectPlace = (poi: POIItem) => {
    places.remember(poi.id);
    feedback();
    setCameraMode("route");
    setSelectedPOI(poi);
    setFloorLevel(poi.floorLevel);
    setIsNavigating(false);
    setCurrentStepIndex(0);
    setArrived(false);
    setActiveTab("map");
  };
  const start = () => {
    if (!route) return;
    setCameraMode("follow");
    feedback();
    setIsNavigating(true);
    setArrived(false);
    setCurrentStepIndex(0);
    setFloorLevel(route.steps[0].floorLevel);
    setRecenterKey((k) => k + 1);
  };
  const nextStep = () => {
    if (!route) return;
    const next = currentStepIndex + 1;
    if (next >= route.steps.length) {
      setIsNavigating(false);
      setArrived(true);
      setCameraMode("route");
      feedback("success");
      AccessibilityInfo.announceForAccessibility(
        "Demo journey complete. You are at " + selectedPOI!.name,
      );
      setFloorLevel(selectedPOI!.floorLevel);
    } else {
      setCurrentStepIndex(next);
      if (cameraMode === "follow") setFloorLevel(route.steps[next].floorLevel);
      if (
        route.steps[next].floorLevel !==
        route.steps[currentStepIndex].floorLevel
      )
        feedback();
      AccessibilityInfo.announceForAccessibility(
        route.steps[next].floorName + ". " + route.steps[next].instruction,
      );
    }
  };
  const changeStepFree = (value: boolean) => {
    setStepFree(value);
    feedback();
    setCameraMode(selectedPOI ? "route" : "floor");
    if (isNavigating) {
      setIsNavigating(false);
      setCurrentStepIndex(0);
    }
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.container}>
          {activeTab === "map" && (
            <View style={styles.container}>
              <IndoorMap
                theme={theme}
                floorLevel={floorLevel}
                route={route}
                destination={selectedPOI}
                position={position}
                positionFloor={positionFloor}
                recenterKey={recenterKey}
                reducedMotion={reducedMotion}
                onSelectPOI={selectPlace}
                hasSheet={!!selectedPOI}
                cameraMode={cameraMode}
                onPan={() => setCameraMode("manual")}
                sheetHeight={sheetHeight}
                topInset={isNavigating ? instructionHeight + 24 : 144}
                nextPoint={
                  route?.steps[currentStepIndex + 1]?.floorLevel ===
                  positionFloor
                    ? route.steps[currentStepIndex + 1].nodePoint
                    : undefined
                }
              />
              {!isNavigating && (
                <FloatingSearchBar
                  theme={theme}
                  value={selectedPOI?.name ?? ""}
                  onPress={() => setSearchVisible(true)}
                />
              )}
              <FloatingMapControls
                theme={theme}
                floorLevel={floorLevel}
                onSelectFloor={(level) => {
                  if (level !== floorLevel) feedback();
                  setFloorLevel(level);
                  setCameraMode(selectedPOI ? "route" : "floor");
                  AccessibilityInfo.announceForAccessibility(
                    "Showing " +
                      atlasSandtonVenue.floors.find((f) => f.level === level)!
                        .name,
                  );
                }}
                cameraMode={cameraMode}
                controlsTop={isNavigating ? instructionHeight + 24 : 144}
                onRecenter={() => {
                  setFloorLevel(positionFloor);
                  setCameraMode(
                    isNavigating ? "follow" : selectedPOI ? "route" : "floor",
                  );
                  setRecenterKey((k) => k + 1);
                }}
                navigating={isNavigating}
                sheetHeight={selectedPOI ? sheetHeight : 210}
                hasDestination={!!selectedPOI}
              />
              {!selectedPOI && (
                <View
                  style={[
                    styles.welcome,
                    { backgroundColor: theme.paper, borderColor: theme.line },
                    shadows.soft,
                  ]}
                >
                  <Text style={[styles.welcomeTitle, { color: theme.ink }]}>
                    Find your way.
                  </Text>
                  <Text style={[styles.meta, { color: theme.muted }]}>
                    Browse a place to preview your route.
                  </Text>
                  <View style={styles.quickRow}>
                    {[
                      { id: "zara", label: "ZARA", icon: "shop" as const },
                      {
                        id: "food-court",
                        label: "Food court",
                        icon: "coffee" as const,
                      },
                      {
                        id: "restrooms-l1",
                        label: "Restrooms",
                        icon: "restroom" as const,
                      },
                    ].map((item) => (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={
                          "Preview " +
                          samplePOIs.find((p) => p.id === item.id)!.name
                        }
                        onPress={() =>
                          selectPlace(samplePOIs.find((p) => p.id === item.id)!)
                        }
                        style={({ pressed }) => [
                          styles.quick,
                          {
                            backgroundColor: theme.subtle,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Icon name={item.icon} color={theme.accent} size={20} />
                        <Text style={[styles.quickText, { color: theme.ink }]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              {selectedPOI && !isNavigating && (
                <DestinationSheet
                  key={selectedPOI.id + String(arrived)}
                  theme={theme}
                  poi={selectedPOI}
                  route={route}
                  stepFree={stepFree}
                  arrived={arrived}
                  saved={places.saved.includes(selectedPOI.id)}
                  onToggleSaved={() => {
                    places.toggleSaved(selectedPOI.id);
                    feedback();
                  }}
                  storageIssue={places.storageIssue}
                  onHeightChange={setSheetHeight}
                  onToggleStepFree={changeStepFree}
                  onStartNavigation={start}
                  onClose={closeDestination}
                />
              )}
              {selectedPOI && isNavigating && route && (
                <ActiveNavigationPanel
                  theme={theme}
                  destination={selectedPOI}
                  route={route}
                  currentStepIndex={currentStepIndex}
                  onHeightChange={setSheetHeight}
                  onInstructionHeightChange={setInstructionHeight}
                  following={cameraMode === "follow"}
                  onOverview={() => {
                    setCameraMode("route");
                    setRecenterKey((k) => k + 1);
                  }}
                  onFollow={() => {
                    setCameraMode("follow");
                    setFloorLevel(positionFloor);
                    setRecenterKey((k) => k + 1);
                  }}
                  onNextStep={nextStep}
                  onStopNavigation={() => {
                    setIsNavigating(false);
                    setCameraMode("route");
                    setCurrentStepIndex(0);
                    setFloorLevel(selectedPOI.floorLevel);
                  }}
                />
              )}
            </View>
          )}
          {activeTab === "explore" && (
            <ExploreScreen theme={theme} onSelectPOI={selectPlace} />
          )}
          {activeTab === "settings" && (
            <SettingsScreen
              theme={theme}
              isDark={isDark}
              onToggleDark={setIsDark}
              reducedMotion={reducedMotion}
              onToggleReducedMotion={setLimitMotion}
              systemReducedMotion={systemReducedMotion}
              haptics={haptics}
              onToggleHaptics={setHaptics}
              stepFree={stepFree}
              onToggleStepFree={changeStepFree}
            />
          )}
          <SearchOverlay
            theme={theme}
            visible={searchVisible}
            onClose={() => setSearchVisible(false)}
            onSelectPOI={selectPlace}
            reducedMotion={reducedMotion}
            savedIds={places.saved}
            recentIds={places.recent}
            onClearRecent={places.clearRecent}
            storageIssue={places.storageIssue}
          />
          <BottomTabBar
            theme={theme}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  welcome: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 84,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    gap: 8,
  },
  welcomeTitle: { fontSize: 24, fontWeight: "600", letterSpacing: -0.5 },
  meta: { fontSize: 16, lineHeight: 20 },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  quick: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
  },
  quickText: { fontSize: 12, fontWeight: "600" },
});
