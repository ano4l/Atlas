import React, { useEffect, useMemo, useRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import MapView, { Circle, LatLng, Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Theme } from "../theme";
import { atlasSandtonVenue } from "../fixtures";
import { MapPoint } from "../map/types";

type Props = {
  theme: Theme;
  progress?: number;
  confidence?: "high" | "medium" | "low";
  floorLevel?: number;
  closure?: boolean;
  moving?: boolean;
  pickMode?: boolean;
  onPick?: () => void;
  selected?: boolean;
  recenterKey?: number;
  routeVisible?: boolean;
  routeReveal?: number;
  reducedMotion?: boolean;
};

const ORIGIN = { latitude: -26.10745, longitude: 28.05675 };
const EXTENT = { latitude: 0.00235, longitude: 0.00205 };

function toCoordinate(point: MapPoint, width: number, height: number): LatLng {
  return {
    latitude: ORIGIN.latitude + ((height / 2 - point.y) / height) * EXTENT.latitude,
    longitude: ORIGIN.longitude + ((point.x - width / 2) / width) * EXTENT.longitude,
  };
}

function pointAlong(polyline: MapPoint[], progress: number): MapPoint {
  if (polyline.length < 2) return polyline[0] ?? atlasSandtonVenue.start;
  const lengths = polyline.slice(1).map((p, i) => Math.hypot(p.x - polyline[i].x, p.y - polyline[i].y));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = Math.max(0, Math.min(1, progress)) * total;
  for (let i = 0; i < lengths.length; i += 1) {
    if (remaining <= lengths[i]) {
      const ratio = lengths[i] === 0 ? 0 : remaining / lengths[i];
      return {
        x: polyline[i].x + (polyline[i + 1].x - polyline[i].x) * ratio,
        y: polyline[i].y + (polyline[i + 1].y - polyline[i].y) * ratio,
      };
    }
    remaining -= lengths[i];
  }
  return polyline[polyline.length - 1];
}

const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f4f2ef" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#686664" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f7f5f2" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#ebe9e5" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e4ebe2" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#dedbd7" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#eee8df" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#e8e5e1" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dce8ec" }] },
];

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#202226" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a7a9ad" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#202226" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#292c30" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#34373c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1d1f22" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#18262c" }] },
];

export function IndoorMap({
  theme, floorLevel = 1, progress = 0.1, confidence = "high", pickMode,
  onPick, recenterKey = 0, routeVisible = false, routeReveal = 1, reducedMotion = false,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const floor = atlasSandtonVenue.floors.find((item) => item.level === floorLevel) ?? atlasSandtonVenue.floors[0];
  const segment = routeVisible ? atlasSandtonVenue.route.find((item) => item.floorId === floor.id) : undefined;
  const route = useMemo(() => {
    const count = Math.max(2, Math.ceil((segment?.polyline.length ?? 0) * routeReveal));
    return (segment?.polyline.slice(0, count) ?? []).map((point) => toCoordinate(point, floor.bounds.width, floor.bounds.height));
  }, [floor, routeReveal, segment]);
  const localProgress = floorLevel === 1 ? Math.min(1, progress / 0.55) : Math.max(0, (progress - 0.45) / 0.55);
  const currentPoint = pointAlong(segment?.polyline ?? [atlasSandtonVenue.start], localProgress);
  const current = toCoordinate(currentPoint, floor.bounds.width, floor.bounds.height);
  const destination = toCoordinate(atlasSandtonVenue.destination.point, floor.bounds.width, floor.bounds.height);

  const focusMap = () => {
    const coordinates = route.length > 1 ? route : [current];
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 150, right: 70, bottom: 210, left: 70 },
      animated: !reducedMotion,
    });
  };

  useEffect(() => { focusMap(); }, [recenterKey, floorLevel, routeVisible]);

  const thirds = [
    { color: "#F06D56", coords: route.slice(0, Math.max(2, Math.ceil(route.length * 0.4))) },
    { color: "#7557A8", coords: route.slice(Math.max(0, Math.floor(route.length * 0.3)), Math.max(2, Math.ceil(route.length * 0.72))) },
    { color: "#3978D4", coords: route.slice(Math.max(0, Math.floor(route.length * 0.62))) },
  ];

  return <Pressable style={styles.container} onPress={pickMode ? onPick : undefined} accessibilityRole={pickMode ? "button" : undefined}>
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      customMapStyle={theme.isDark ? darkMapStyle : lightMapStyle}
      initialRegion={{ ...ORIGIN, latitudeDelta: 0.0032, longitudeDelta: 0.0027 }}
      showsCompass={false}
      showsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      mapPadding={{ top: 110, right: 16, bottom: 150, left: 16 }}
      onMapReady={focusMap}
    >
      {route.length > 1 && <Polyline coordinates={route} strokeColor={theme.isDark ? "#17181A" : "#FFFFFF"} strokeWidth={12} lineCap="round" lineJoin="round" />}
      {thirds.map((part) => part.coords.length > 1 && <Polyline key={part.color} coordinates={part.coords} strokeColor={part.color} strokeWidth={7} lineCap="round" lineJoin="round" />)}
      {routeVisible && floorLevel === atlasSandtonVenue.destination.floorLevel && <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
        <View style={styles.destination}><View style={styles.destinationCore} /></View>
      </Marker>}
      <Circle center={current} radius={confidence === "low" ? 24 : confidence === "medium" ? 17 : 11} fillColor="rgba(45,118,216,0.16)" strokeColor="rgba(45,118,216,0.12)" />
      <Marker coordinate={current} anchor={{ x: 0.5, y: 0.5 }} flat>
        <View style={styles.position}><View style={styles.positionCore} /></View>
      </Marker>
    </MapView>
    <View pointerEvents="none" style={[styles.truthBadge, { backgroundColor: theme.isDark ? "rgba(27,29,32,0.88)" : "rgba(255,255,255,0.88)" }]} />
  </Pressable>;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%", overflow: "hidden" },
  position: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#1557A0", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  positionCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#3478D4" },
  destination: { width: 26, height: 26, borderRadius: 8, backgroundColor: "#F06D56", borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#60271C", shadowOpacity: 0.25, shadowRadius: 7, elevation: 6 },
  destinationCore: { width: 6, height: 6, borderRadius: 2, backgroundColor: "#FFFFFF" },
  truthBadge: { position: "absolute", right: 0, bottom: 0, width: 1, height: 1 },
});
