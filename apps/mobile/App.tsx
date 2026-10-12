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
import { Icon } from "./src/components/Icon";
import { TabKey } from "./src/components/BottomTabBar";
import { atlasSandtonVenue, samplePOIs } from "./src/fixtures";
import { POIItem } from "./src/map/types";
import { buildDemoRoute } from "./src/map/demo-routing";
import { darkTheme, lightTheme, shadows } from "./src/theme";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("map");
  const [isDark, setIsDark] = useState(false);
  const [floorLevel, setFloorLevel] = useState(1);
  const [recenterKey, setRecenterKey] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
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
  };
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (selectedPOI) {
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
    setSelectedPOI(poi);
    setFloorLevel(poi.floorLevel);
    setIsNavigating(false);
    setCurrentStepIndex(0);
    setArrived(false);
    setActiveTab("map");
  };
  const start = () => {
    if (!route) return;
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
      setFloorLevel(selectedPOI!.floorLevel);
    } else {
      setCurrentStepIndex(next);
      setFloorLevel(route.steps[next].floorLevel);
    }
    setRecenterKey((k) => k + 1);
  };
  const changeStepFree = (value: boolean) => {
    setStepFree(value);
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
                onSelectFloor={setFloorLevel}
                onRecenter={() => setRecenterKey((k) => k + 1)}
                navigating={isNavigating}
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
                  theme={theme}
                  poi={selectedPOI}
                  route={route}
                  stepFree={stepFree}
                  arrived={arrived}
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
                  onNextStep={nextStep}
                  onStopNavigation={() => {
                    setIsNavigating(false);
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
              onToggleReducedMotion={setReducedMotion}
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
