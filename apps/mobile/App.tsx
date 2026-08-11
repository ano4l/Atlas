import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
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
import { atlasSandtonVenue, samplePOIs } from "./src/fixtures";
import { POIItem } from "./src/map/types";
import { darkTheme, lightTheme } from "./src/theme";

export default function App() {
  // Navigation & Screen state
  const [activeTab, setActiveTab] = useState<"map" | "explore" | "settings">("map");
  const [isDark, setIsDark] = useState(false);
  const [floorLevel, setFloorLevel] = useState<number>(1);
  const [recenterKey, setRecenterKey] = useState<number>(0);
  
  // Search Overlay
  const [searchVisible, setSearchOverlayVisible] = useState(false);

  // Selected Destination State
  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const routeReveal = useRef(new Animated.Value(0)).current;
  const [routeRevealValue, setRouteRevealValue] = useState(0);

  // Active Navigation State
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progressRatio, setProgressRatio] = useState<number>(0.1);

  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    const listenerId = routeReveal.addListener(({ value }) => setRouteRevealValue(value));
    return () => routeReveal.removeListener(listenerId);
  }, [routeReveal]);

  // Web container styling
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.body.style.margin = "0";
      document.body.style.background = "#121417";
      document.body.style.minHeight = "100vh";
      const root = document.getElementById("root");
      if (root) {
        root.style.minHeight = "100vh";
        root.style.width = "100%";
        root.style.display = "flex";
        root.style.justifyContent = "center";
        root.style.alignItems = "stretch";
        root.style.background = "#121417";
      }
    }
  }, []);

  // Handle selecting a POI from Search or Explore
  const handleSelectPOI = (poi: POIItem) => {
    setSelectedPOI(poi);
    setFloorLevel(poi.floorLevel === 2 ? 1 : poi.floorLevel); // Start view on starting floor level
    setSheetVisible(true);
    setIsNavigating(false);
    setActiveTab("map");
    routeReveal.setValue(0);
    Animated.timing(routeReveal, {
      toValue: 1,
      duration: reducedMotion ? 0 : 700,
      useNativeDriver: false,
    }).start();
  };

  // Start active navigation
  const handleStartNavigation = () => {
    setSheetVisible(false);
    setIsNavigating(true);
    setCurrentStepIndex(0);
    setProgressRatio(0.12);
  };

  // Step forward in active navigation
  const handleNextStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < atlasSandtonVenue.steps.length) {
      setCurrentStepIndex(nextIdx);
      const nextRatio = (nextIdx + 1) / atlasSandtonVenue.steps.length;
      setProgressRatio(nextRatio);

      // Auto switch floor level if step moves to floor 2
      const step = atlasSandtonVenue.steps[nextIdx];
      if (step.floorLevel === 2 && floorLevel !== 2) {
        setFloorLevel(2);
      }
    } else {
      // Arrived at destination
      setIsNavigating(false);
      setSheetVisible(true);
    }
  };

  // Stop active navigation
  const handleStopNavigation = () => {
    setIsNavigating(false);
    setSheetVisible(true);
    setProgressRatio(0.1);
    setCurrentStepIndex(0);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.appContainer}>
        {/* TAB 1: FULL SCREEN INTERACTIVE MAP */}
        {activeTab === "map" && (
          <View style={styles.mapTabWrapper}>
            {/* Full-screen Interactive Vector Map */}
            <IndoorMap
              theme={theme}
              floorLevel={floorLevel}
              progress={progressRatio}
              confidence="high"
              recenterKey={recenterKey}
              moving={isNavigating && currentStepIndex === 2}
              routeVisible={Boolean(selectedPOI)}
              routeReveal={routeRevealValue}
              reducedMotion={reducedMotion}
            />

            {/* Top Floating Search Pill */}
            {!isNavigating && (
              <FloatingSearchBar
                theme={theme}
                value={selectedPOI ? selectedPOI.name : ""}
                onPress={() => setSearchOverlayVisible(true)}
                onVoicePress={() => setSearchOverlayVisible(true)}
              />
            )}

            {/* Floating Map Controls (Venue badge, confidence, floor selector, recenter, compass) */}
            <FloatingMapControls
              theme={theme}
              venueName={atlasSandtonVenue.venueName}
              floorLevel={floorLevel}
              onSelectFloor={(lvl) => setFloorLevel(lvl)}
              onRecenter={() => setRecenterKey((k) => k + 1)}
              confidence="high"
              onConfidencePress={() => {}}
            />

            {/* Destination Preview Sheet (when not actively navigating) */}
            {!isNavigating && sheetVisible && selectedPOI && (
              <DestinationSheet
                theme={theme}
                poi={selectedPOI}
                onStartNavigation={handleStartNavigation}
                onClose={() => setSheetVisible(false)}
              />
            )}

            {/* Active Turn-by-Turn Instruction Panel */}
            {isNavigating && (
              <ActiveNavigationPanel
                theme={theme}
                destination={selectedPOI ?? atlasSandtonVenue.destination}
                steps={atlasSandtonVenue.steps}
                currentStepIndex={currentStepIndex}
                progressRatio={progressRatio}
                onNextStep={handleNextStep}
                onStopNavigation={handleStopNavigation}
              />
            )}
          </View>
        )}

        {/* TAB 2: EXPLORE SCREEN */}
        {activeTab === "explore" && (
          <ExploreScreen
            theme={theme}
            onSelectPOI={handleSelectPOI}
          />
        )}

        {/* TAB 3: SETTINGS SCREEN */}
        {activeTab === "settings" && (
          <SettingsScreen
            theme={theme}
            isDark={isDark}
            onToggleDark={setIsDark}
            reducedMotion={reducedMotion}
            onToggleReducedMotion={setReducedMotion}
          />
        )}

        {/* Search Modal / Overlay */}
        <SearchOverlay
          theme={theme}
          visible={searchVisible}
          onClose={() => setSearchOverlayVisible(false)}
          onSelectPOI={handleSelectPOI}
        />

        {/* Persistent Floating 3-Destination Bottom Navigation Bar */}
        <BottomTabBar
          theme={theme}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    overflow: "hidden",
  },
  appContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  mapTabWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
});
