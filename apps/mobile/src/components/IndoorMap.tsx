import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, {
  Circle,
  LatLng,
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { Theme } from "../theme";
import { atlasSandtonVenue, samplePOIs } from "../fixtures";
import { MapPoint, POIItem } from "../map/types";
import { Icon } from "./Icon";
import { DemoRoute } from "../map/demo-routing";

type Props = {
  theme: Theme;
  floorLevel: number;
  recenterKey: number;
  route: DemoRoute | null;
  destination: POIItem | null;
  position: MapPoint;
  positionFloor: number;
  reducedMotion: boolean;
  onSelectPOI: (poi: POIItem) => void;
  hasSheet: boolean;
};
const ORIGIN = { latitude: -26.10745, longitude: 28.05675 };
const EXTENT = { latitude: 0.00235, longitude: 0.00205 };
const toCoordinate = (p: MapPoint): LatLng => ({
  latitude: ORIGIN.latitude + ((275 - p.y) / 550) * EXTENT.latitude,
  longitude: ORIGIN.longitude + ((p.x - 190) / 380) * EXTENT.longitude,
});

export function IndoorMap({
  theme,
  floorLevel,
  recenterKey,
  route,
  destination,
  position,
  positionFloor,
  reducedMotion,
  onSelectPOI,
  hasSheet,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const floor = atlasSandtonVenue.floors.find((f) => f.level === floorLevel)!;
  const segment = route?.segments.find((s) => s.floorLevel === floorLevel);
  const focus = () =>
    mapRef.current?.fitToCoordinates(floor.plate.map(toCoordinate), {
      edgePadding: {
        top: 190,
        right: 64,
        bottom: hasSheet ? 300 : 190,
        left: 32,
      },
      animated: !reducedMotion,
    });
  useEffect(() => {
    focus();
  }, [recenterKey, floorLevel, hasSheet]);
  const backdrop = [
    { x: -2000, y: -2000 },
    { x: 2380, y: -2000 },
    { x: 2380, y: 2550 },
    { x: -2000, y: 2550 },
  ];
  return (
    <View style={[styles.container, { backgroundColor: theme.mapBg }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        mapType={Platform.OS === "android" ? "none" : "standard"}
        initialRegion={{
          ...ORIGIN,
          latitudeDelta: 0.0038,
          longitudeDelta: 0.003,
        }}
        showsCompass={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={focus}
        accessibilityLabel={"Illustrative indoor map, " + floor.name}
      >
        <Polygon
          coordinates={backdrop.map(toCoordinate)}
          fillColor={theme.mapBg}
          strokeColor={theme.mapBg}
          zIndex={1}
        />
        {(floor.contextZones ?? []).map((zone, i) => (
          <Polygon
            key={i}
            coordinates={zone.map(toCoordinate)}
            fillColor={theme.mapRoom}
            strokeColor={theme.mapStroke}
            strokeWidth={1}
            zIndex={2}
          />
        ))}
        {(floor.corridorPaths ?? []).map((path, i) => (
          <Polyline
            key={"edge-" + i}
            coordinates={path.map(toCoordinate)}
            strokeColor={theme.mapStroke}
            strokeWidth={24}
            lineCap="round"
            lineJoin="round"
            zIndex={3}
          />
        ))}
        {(floor.corridorPaths ?? []).map((path, i) => (
          <Polyline
            key={"walk-" + i}
            coordinates={path.map(toCoordinate)}
            strokeColor={theme.mapConcourse}
            strokeWidth={20}
            lineCap="round"
            lineJoin="round"
            zIndex={4}
          />
        ))}
        {segment && segment.polyline.length > 1 && (
          <>
            <Polyline
              coordinates={segment.polyline.map(toCoordinate)}
              strokeColor={theme.routeCasing}
              strokeWidth={11}
              lineCap="round"
              lineJoin="round"
              zIndex={5}
            />
            <Polyline
              coordinates={segment.polyline.map(toCoordinate)}
              strokeColor={theme.accent}
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
              zIndex={6}
            />
          </>
        )}
        {samplePOIs
          .filter((p) => p.floorLevel === floorLevel)
          .map((p) => (
            <Marker
              key={p.id}
              coordinate={toCoordinate(p.point)}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => onSelectPOI(p)}
              zIndex={destination?.id === p.id ? 10 : 7}
            >
              <View
                style={[
                  styles.place,
                  {
                    backgroundColor:
                      destination?.id === p.id ? theme.primary : theme.paper,
                    borderColor: theme.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.placeText,
                    {
                      color:
                        destination?.id === p.id
                          ? theme.primaryText
                          : theme.mapText,
                    },
                  ]}
                >
                  {p.name}
                </Text>
              </View>
            </Marker>
          ))}
        {floor.facilities
          .filter((f) => f.kind === "lift" || f.kind === "escalator")
          .map((f) => (
            <Marker
              key={f.id}
              coordinate={toCoordinate(f.point)}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={8}
            >
              <View
                style={[
                  styles.core,
                  { backgroundColor: theme.paper, borderColor: theme.line },
                ]}
              >
                <Icon
                  name={f.kind === "lift" ? "lift" : "route"}
                  color={theme.muted}
                  size={16}
                />
              </View>
            </Marker>
          ))}
        {positionFloor === floorLevel && (
          <>
            <Circle
              center={toCoordinate(position)}
              radius={9}
              fillColor="rgba(39,93,216,0.13)"
              strokeColor="rgba(39,93,216,0.16)"
              zIndex={9}
            />
            <Marker
              coordinate={toCoordinate(position)}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={11}
            >
              <View style={styles.position}>
                <View
                  style={[
                    styles.positionCore,
                    { backgroundColor: theme.accent },
                  ]}
                />
              </View>
            </Marker>
          </>
        )}
      </MapView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  place: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  placeText: { fontSize: 12, fontWeight: "600" },
  core: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  position: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  positionCore: { width: 14, height: 14, borderRadius: 7 },
});
