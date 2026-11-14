import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  Text,
  BackHandler,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import {
  ActiveNavigationPanel,
  DestinationSheet,
  ExploreScreen,
  FloatingMapControls,
  IndoorMap,
  SearchOverlay,
  SettingsScreen,
} from "./src/components";
import {
  FeedbackContext,
  MotionPressable,
  useFeedback,
} from "./src/components/Motion";
import { GlassSurface } from "./src/components/GlassSurface";
import { usePlaceMemory } from "./src/usePlaceMemory";
import { CameraMode } from "./src/map/camera";
import { Icon } from "./src/components/Icon";
import { atlasSandtonVenue } from "./src/fixtures";
import { POIItem } from "./src/map/types";
import { buildDemoRoute } from "./src/map/demo-routing";
import { darkTheme, lightTheme, Theme } from "./src/theme";
import { MapHomeSheet } from "./src/components/MapHomeSheet";
import { ConnectedVenueScreen, connectedVenueEnabled } from "./src/components/ConnectedVenueScreen";
import { radius, space, textSize } from "./src/theme";

type TabKey = "map" | "explore" | "settings" | "test-venue";
const initialFloor = atlasSandtonVenue.startFloorLevel;
const initialSheetHeight = 140;

export default function App() {
  const [systemReducedMotion, setSystemReducedMotion] = useState(true);
  const [limitMotion, setLimitMotion] = useState(false);
  const [haptics, setHaptics] = useState(true);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
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
  const [sheetHeight, setSheetHeight] = useState(initialSheetHeight);
  const liveHomeSheetHeight = useSharedValue(initialSheetHeight);
  const [headerHeight, setHeaderHeight] = useState(60);
  const [instructionHeight, setInstructionHeight] = useState(108);
  const [activeTab, setActiveTab] = useState<TabKey>("map");
  const [darkPreference, setDarkPreference] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();
  const isDark = darkPreference ?? colorScheme === "dark";
  const [floorLevel, setFloorLevel] = useState(initialFloor);
  const [recenterKey, setRecenterKey] = useState(0);
  const [searchScope, setSearchScope] = useState<"all" | "saved" | null>(null);
  const searchVisible = searchScope !== null;
  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null);
  const reducedMotion = systemReducedMotion || limitMotion;
  const [stepFree, setStepFree] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const pendingMenuAction = useRef<(() => void) | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [walking, setWalking] = useState(false);
  const [legProgress, setLegProgress] = useState(0);
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  const [arrived, setArrived] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;
  const route = useMemo(
    () => (selectedPOI ? buildDemoRoute(selectedPOI, stepFree) : null),
    [selectedPOI, stepFree],
  );
  const currentStep = isNavigating ? route?.steps[currentStepIndex] : undefined;
  const nextNode = route?.steps[currentStepIndex + 1]?.nodePoint;
  const movingPosition =
    currentStep && nextNode
      ? {
          x:
            currentStep.nodePoint.x +
            (nextNode.x - currentStep.nodePoint.x) * legProgress,
          y:
            currentStep.nodePoint.y +
            (nextNode.y - currentStep.nodePoint.y) * legProgress,
        }
      : currentStep?.nodePoint;
  const position =
    arrived && selectedPOI
      ? selectedPOI.point
      : (movingPosition ?? atlasSandtonVenue.start);
  const positionFloor =
    arrived && selectedPOI
      ? selectedPOI.floorLevel
      : (currentStep?.floorLevel ?? atlasSandtonVenue.startFloorLevel);
  const closeDestination = () => {
    liveHomeSheetHeight.value = initialSheetHeight;
    setSelectedPOI(null);
    setIsNavigating(false);
    setArrived(false);
    setCurrentStepIndex(0);
    setFloorLevel(initialFloor);
    setCameraMode("floor");
    setWalking(false);
    setLegProgress(0);
  };
  const stop = () => {
    setIsNavigating(false);
    setWalking(false);
    setLegProgress(0);
    setCameraMode("route");
    setCurrentStepIndex(0);
    if (selectedPOI) setFloorLevel(selectedPOI.floorLevel);
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
          if (isNavigating) stop();
          else closeDestination();
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
  }, [selectedPOI, activeTab, isNavigating]);
  const selectPlace = (poi: POIItem) => {
    places.remember(poi.id);
    feedback();
    setCameraMode("route");
    setSelectedPOI(poi);
    setFloorLevel(poi.floorLevel);
    setIsNavigating(false);
    setCurrentStepIndex(0);
    setLegProgress(0);
    setWalking(false);
    setArrived(false);
    setActiveTab("map");
  };
  const start = () => {
    if (!route) return;
    setLegProgress(0);
    setWalking(true);
    setCameraMode("follow");
    feedback();
    setIsNavigating(true);
    setArrived(false);
    setCurrentStepIndex(0);
    setFloorLevel(route.steps[0].floorLevel);
    setRecenterKey((k) => k + 1);
  };
  const nextStep = () => {
    setLegProgress(0);
    if (!route) return;
    const next = currentStepIndex + 1;
    if (next >= route.steps.length) {
      setIsNavigating(false);
      setArrived(true);
      setWalking(false);
      setCameraMode("route");
      feedback("success");
      AccessibilityInfo.announceForAccessibility(
        "Demo walk complete. " + selectedPOI!.name,
      );
      setFloorLevel(selectedPOI!.floorLevel);
    } else {
      setCurrentStepIndex(next);
      if (cameraMode === "follow") setFloorLevel(route.steps[next].floorLevel);
      feedback("turn");
      AccessibilityInfo.announceForAccessibility(
        route.steps[next].floorName + ". " + route.steps[next].instruction,
      );
    }
  };
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) =>
      setAppActive(state === "active"),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (
      !isNavigating ||
      !walking ||
      !appActive ||
      activeTab !== "map" ||
      searchVisible ||
      menuVisible ||
      !currentStep
    )
      return;
    // Accelerated schematic walkthrough. Advance along each straight gallery leg.
    const length = nextNode
      ? Math.hypot(
          nextNode.x - currentStep.nodePoint.x,
          nextNode.y - currentStep.nodePoint.y,
        )
      : 0;
    const timer = setInterval(
      () =>
        setLegProgress((value) => Math.min(1, value + 6 / Math.max(6, length))),
      500,
    );
    return () => clearInterval(timer);
  }, [
    isNavigating,
    walking,
    appActive,
    activeTab,
    searchVisible,
    menuVisible,
    currentStep,
    nextNode,
  ]);
  useEffect(() => {
    if (isNavigating && walking && legProgress >= 1) nextStep();
  }, [legProgress, walking, isNavigating]);
  const changeStepFree = (value: boolean) => {
    setStepFree(value);
    feedback();
    setCameraMode(selectedPOI ? "route" : "floor");
    if (isNavigating) {
      setIsNavigating(false);
      setCurrentStepIndex(0);
    }
  };
  const openSearch = () => setSearchScope("all");
  const topInset = isNavigating
    ? instructionHeight + 20
    : selectedPOI
      ? 68
      : headerHeight + 20;
  return (
    <SafeAreaProvider>
      {Platform.OS === "android" && (
        <SafeAreaView
          edges={["top"]}
          style={{ backgroundColor: theme.chrome }}
        />
      )}
      <SafeAreaView
        edges={
          Platform.OS === "android"
            ? ["left", "right", "bottom"]
            : ["top", "left", "right", "bottom"]
        }
        style={[
          styles.safeArea,
          { backgroundColor: activeTab === "map" ? theme.mapBg : theme.bg },
        ]}
      >
        <StatusBar
          style={isDark || Platform.OS === "android" ? "light" : "dark"}
        />
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
                navigating={isNavigating}
                arrived={arrived}
                onSelectPOI={selectPlace}
                hasSheet={!!selectedPOI}
                cameraMode={cameraMode}
                onPan={() => setCameraMode("manual")}
                sheetHeight={sheetHeight}
                liveSheetHeight={!isNavigating ? liveHomeSheetHeight : undefined}
                topInset={topInset}
                nextPoint={
                  route?.steps[currentStepIndex + 1]?.floorLevel ===
                  positionFloor
                    ? route.steps[currentStepIndex + 1].nodePoint
                    : undefined
                }
              />
              {!selectedPOI && (
                <MapHeader
                  theme={theme}
                  onHeightChange={setHeaderHeight}
                  onMenu={() => setMenuVisible(true)}
                />
              )}
              {selectedPOI && !isNavigating && (
                <View pointerEvents="box-none" style={styles.mapHeader}>
                  <GlassSurface theme={theme} style={styles.roundSurface}>
                    <MotionPressable
                      accessibilityRole="button"
                      accessibilityLabel="Back to map"
                      onPress={closeDestination}
                      style={({ pressed }) => [
                        styles.roundButton,
                        pressed && { backgroundColor: theme.subtle },
                      ]}
                    >
                      <Icon name="back" color={theme.ink} size={21} />
                    </MotionPressable>
                  </GlassSurface>
                  <GlassSurface
                    theme={theme}
                    pointerEvents="none"
                    style={styles.previewBadge}
                  >
                    <Icon name="walking" color={theme.accent} size={17} />
                    <Text style={[styles.shortLabel, { color: theme.ink }]}>
                      {arrived ? "Indoor demo" : "Walking preview"}
                    </Text>
                  </GlassSurface>
                </View>
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
                controlsTop={topInset}
                onRecenter={() => {
                  setFloorLevel(
                    !isNavigating && selectedPOI
                      ? selectedPOI.floorLevel
                      : positionFloor,
                  );
                  setCameraMode(
                    !isNavigating && selectedPOI ? "route" : "follow",
                  );
                  setRecenterKey((k) => k + 1);
                }}
                navigating={isNavigating}
                previewing={!!selectedPOI && !isNavigating}
                sheetHeight={sheetHeight}
                liveSheetHeight={!isNavigating ? liveHomeSheetHeight : undefined}
              />
              {!selectedPOI && (
                <MapHomeSheet
                  theme={theme}
                  savedIds={places.saved}
                  recentIds={places.recent}
                  onSelect={selectPlace}
                  onSearch={openSearch}
                  onExplore={() => setActiveTab("explore")}
                  onSaved={() => setSearchScope("saved")}
                  onHeightChange={setSheetHeight}
                  liveSheetHeight={liveHomeSheetHeight}
                />
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
                  liveSheetHeight={liveHomeSheetHeight}
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
                  walking={walking}
                  legProgress={legProgress}
                  onToggleWalking={() => setWalking((v) => !v)}
                  onNextStep={nextStep}
                  onStopNavigation={stop}
                />
              )}
            </View>
          )}
          {activeTab !== "map" && (
            <MotionPressable
              onPress={() => setActiveTab("map")}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.backHeader,
                pressed && { backgroundColor: theme.subtle },
              ]}
            >
              <Icon name="back" color={theme.ink} size={22} />
              <Text
                style={{ color: theme.ink, fontSize: textSize.body, fontWeight: "600" }}
              >
                Back to map
              </Text>
            </MotionPressable>
          )}
          {activeTab === "explore" && (
            <ExploreScreen
              theme={theme}
              onSelectPOI={selectPlace}
              savedIds={places.saved}
              onSearch={() => openSearch()}
            />
          )}
          {activeTab === "settings" && (
            <SettingsScreen
              theme={theme}
              isDark={isDark}
              onToggleDark={setDarkPreference}
              reducedMotion={reducedMotion}
              onToggleReducedMotion={setLimitMotion}
              systemReducedMotion={systemReducedMotion}
              haptics={haptics}
              onToggleHaptics={setHaptics}
              stepFree={stepFree}
              onToggleStepFree={changeStepFree}
            />
          )}
          {activeTab === "test-venue" && (
            <ConnectedVenueScreen theme={theme} reducedMotion={reducedMotion} stepFree={stepFree} />
          )}
          {searchVisible && (
            <SearchOverlay
              theme={theme}
              onClose={() => setSearchScope(null)}
              onSelectPOI={selectPlace}
              reducedMotion={reducedMotion}
              savedIds={places.saved}
              recentIds={places.recent}
              onClearRecent={places.clearRecent}
              storageIssue={places.storageIssue}
              initialSavedOnly={searchScope === "saved"}
              focusSearch={searchScope === "all"}
            />
          )}
          <Modal
            visible={menuVisible}
            onDismiss={() => {
              pendingMenuAction.current?.();
              pendingMenuAction.current = null;
            }}
            transparent
            animationType={reducedMotion ? "none" : "fade"}
            onRequestClose={() => setMenuVisible(false)}
          >
            <View style={styles.menuOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setMenuVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Dismiss menu"
              />
              <GlassSurface
                theme={theme}
                variant="panel"
                style={styles.menuSheet}
              >
                <View style={styles.pageHeader}>
                  <Text
                    style={{
                      flex: 1,
                      color: theme.ink,
                      fontSize: textSize.heading,
                      fontWeight: "600",
                    }}
                  >
                    Map options
                  </Text>
                  <MotionPressable
                    accessibilityRole="button"
                    accessibilityLabel="Close menu"
                    onPress={() => setMenuVisible(false)}
                    style={styles.roundButton}
                  >
                    <Icon name="close" color={theme.ink} />
                  </MotionPressable>
                </View>
                <ScrollView>
                  {(
                    [
                      {
                        title: "Map overview",
                        icon: "map",
                        action: () => {
                          setCameraMode("floor");
                          setRecenterKey((k) => k + 1);
                        },
                      },
                      {
                        title: "Settings",
                        icon: "settings",
                        action: () => setActiveTab("settings"),
                      },
                      ...(connectedVenueEnabled ? [{
                        title: "Fictional test venue",
                        icon: "layers" as const,
                        action: () => setActiveTab("test-venue"),
                      }] : []),
                    ] as const
                  ).map((item) => (
                    <MotionPressable
                      key={item.title}
                      accessibilityRole="button"
                      onPress={() => {
                        setMenuVisible(false);
                        if (Platform.OS === "ios")
                          pendingMenuAction.current = item.action;
                        else item.action();
                      }}
                      style={styles.menuItem}
                    >
                      <Icon name={item.icon} color={theme.accent} />
                      <Text style={{ color: theme.ink, fontSize: textSize.body }}>
                        {item.title}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Icon name="arrow" color={theme.muted} size={18} />
                    </MotionPressable>
                  ))}
                  <Text
                    style={{ color: theme.muted, fontSize: textSize.caption, padding: space.lg }}
                  >
                    Sandton schematic · Demo position
                  </Text>
                </ScrollView>
              </GlassSurface>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
function MapHeader({
  theme,
  onHeightChange,
  onMenu,
}: {
  theme: Theme;
  onHeightChange: (height: number) => void;
  onMenu: () => void;
}) {
  return (
    <View
      pointerEvents="box-none"
      onLayout={(event) => onHeightChange(event.nativeEvent.layout.height)}
      style={styles.mapHeader}
    >
      <GlassSurface theme={theme} pointerEvents="none" style={styles.venue}>
        <View style={[styles.venueMark, { backgroundColor: theme.accentSoft }]}>
          <Icon name="atlas" color={theme.accent} size={22} />
        </View>
        <View style={styles.venueCopy}>
          <Text
            accessibilityRole="header"
            style={[styles.venueName, { color: theme.ink }]}
          >
            {atlasSandtonVenue.venueName}
          </Text>
          <Text style={[styles.venueMeta, { color: theme.muted }]}>
            Demo venue
          </Text>
        </View>
      </GlassSurface>
      <GlassSurface theme={theme} style={styles.roundSurface}>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Map options"
          onPress={onMenu}
          style={({ pressed }) => [
            styles.roundButton,
            pressed && { backgroundColor: theme.subtle },
          ]}
        >
          <Icon name="settings" color={theme.ink} size={21} />
        </MotionPressable>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  mapHeader: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.md,
  },
  venue: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: space.sm,
    paddingVertical: space.sm,
    paddingLeft: space.sm,
    paddingRight: space.lg,
    borderRadius: radius.xl,
  },
  venueMark: {
    width: 37,
    height: 37,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  venueCopy: { flexShrink: 1, gap: space.xxs },
  venueName: { fontSize: textSize.subhead, fontWeight: "700", letterSpacing: -0.2 },
  venueMeta: { fontSize: textSize.caption, fontWeight: "500" },
  roundSurface: { borderRadius: radius.pill },
  shortLabel: { fontSize: textSize.footnote, fontWeight: "700" },
  previewBadge: {
    minHeight: 40,
    borderRadius: radius.pill,
    flexShrink: 1,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.sm,
    gap: space.sm,
  },
  backHeader: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderRadius: radius.lg,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(8,20,30,0.25)",
    justifyContent: "center",
    padding: space.xxl,
  },
  menuSheet: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "100%",
    alignSelf: "center",
    borderRadius: radius.sheet,
    padding: space.md,
  },
  menuItem: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    paddingHorizontal: space.lg,
  },
  safeArea: { flex: 1 },
  container: { flex: 1 },
});
