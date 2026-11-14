import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator, AppState, Keyboard, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { getPlatformRequestId, PlatformApiClient, PlatformApiError, PlatformResponseError, type MapPackage, type Route } from "@atlas/api-client";
import type { ConnectedVenue } from "../map/connected-venue";
import { resolveCheckpoint } from "../map/checkpoint";
import { hasExpired, nextEdgeAvailabilityChange } from "../map/edge-availability";
import { createOfflinePlanner, isUnavailable, searchCachedVenue } from "../map/offline-venue";
import { createVenueCache } from "../map/venue-cache";
import { loadPublishedVenue } from "../map/load-venue";
import type { CameraMode } from "../map/camera";
import type { POIItem, RouteFloorSegment } from "../map/types";
import type { Theme } from "../theme";
import { Icon } from "./Icon";
import { CheckpointScanner } from "./CheckpointScanner";
import { IndoorMap } from "./IndoorMap";
import { createRouteProgress, type RouteProgress } from "@atlas/positioning-core";
import { createRouteReplay, createWalkSample } from "../map/guidance-replay";
import { findSimulatedDetour, requestReroute } from "../map/reroute";
import { navigationDiagnostics } from "../map/navigation-diagnostics";

import { MotionPressable } from "./Motion";
const baseUrl = process.env.EXPO_PUBLIC_ATLAS_API_URL?.trim();
const venueSlug = "atlas-synthetic-mall";
const api = baseUrl ? new PlatformApiClient({ baseUrl }) : null;
const cacheKey = `atlas:venue:${baseUrl}:${venueSlug}:v1`;
const venueCache = createVenueCache(AsyncStorage, cacheKey, venueSlug);
export const connectedVenueEnabled = api !== null;

type Result<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; value: T };

function withRequestReference(message: string, error: unknown): string {
  const id = getPlatformRequestId(error);
  return id ? `${message}\nReference ${id}` : message;
}

type Props = { theme: Theme; reducedMotion: boolean; stepFree: boolean };
type LoadedMap = {
  pkg: MapPackage;
  venue: ConnectedVenue;
  syncedAtMs: number;
  offline: boolean;
  saved: boolean;
};

export function ConnectedVenueScreen({ theme, reducedMotion, stepFree }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [map, setMap] = useState<Result<LoadedMap>>({ status: "loading" });
  const reload = () => {
    setMap({ status: "loading" });
    setAttempt((previous) => previous + 1);
  };
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (!api) throw new Error("The test venue is unavailable.");
        const value = await loadPublishedVenue(api, venueCache, venueSlug, controller.signal);
        if (controller.signal.aborted) return;
        if (!value) {
          navigationDiagnostics.record("map", "failed");
          setMap({ status: "error", message: "The fictional venue hasn’t been published yet." });
          return;
        }
        if (value.offline) navigationDiagnostics.record("map", "using-saved-map", value.fallbackError);
        setMap({ status: "ready", value });
      } catch (error) {
        if (!controller.signal.aborted) {
          navigationDiagnostics.record("map", "failed", error);
          setMap({
            status: "error",
            message: withRequestReference(error instanceof PlatformResponseError
              ? "The venue map couldn’t be read. Try syncing again."
              : "The venue couldn’t load. Check your connection and try again.", error),
          });
        }
      }
    }
    void load();
    return () => {
      controller.abort();
    };
  }, [attempt]);

  if (map.status === "ready" && api) {
    return <VenueRoutePreview theme={theme} reducedMotion={reducedMotion} stepFree={stepFree} map={map.value} client={api} onSync={reload} />;
  }
  return (
    <View style={[styles.messageScreen, { backgroundColor: theme.bg }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Fictional test venue</Text>
      {map.status === "loading" && <ActivityIndicator color={theme.accent} accessibilityLabel="Loading venue" />}
      {map.status === "error" && (
        <>
          <Text accessibilityRole="alert" style={{ color: theme.inkSecondary }}>{map.message}</Text>
          <Choice theme={theme} label="Try again" onPress={reload} />
        </>
      )}
    </View>
  );
}

function VenueRoutePreview({
  theme, reducedMotion, stepFree, map, client, onSync,
}: Props & { map: LoadedMap; client: PlatformApiClient; onSync: () => void }) {
  const { pkg, venue } = map;
  const offlinePlanner = useMemo(() => createOfflinePlanner(pkg), [pkg]);
  const [offline, setOffline] = useState(map.offline);
  const [start, setStart] = useState(venue.starts[0]);
  const [floorLevel, setFloorLevel] = useState(start.floorLevel);
  const [cameraMode, setCameraMode] = useState<CameraMode>("floor");
  const [destination, setDestination] = useState<POIItem | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<Result<POIItem[]>>({ status: "ready", value: venue.places });
  const [route, setRoute] = useState<Result<{ data: Route; segments: RouteFloorSegment[] }> | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [routeAttempt, setRouteAttempt] = useState(0);
  const replayRef = useRef<{
    tracker: ReturnType<typeof createRouteProgress>;
    sample: ReturnType<typeof createRouteReplay>;
    legStartedAt: number;
    elapsed: number;
    progress: RouteProgress;
    route: Route;
    detour?: { sample: ReturnType<typeof createWalkSample>; startedAt: number; validUntilMs: number | null };
    detourRequested?: boolean;
    lastEstimate: ReturnType<ReturnType<typeof createRouteReplay>>;
  } | null>(null);
  const rerouteRef = useRef<AbortController | null>(null);
  const [replayRoute, setReplayRoute] = useState<RouteFloorSegment[] | null>(null);
  const [routeExpired, setRouteExpired] = useState(false);
  const [rerouteState, setRerouteState] = useState<"working" | "failed" | "updated" | null>(null);
  const [rerouteError, setRerouteError] = useState<string | null>(null);
  const [detourRequested, setDetourRequested] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [replay, setReplay] = useState<{
    progress: RouteProgress;
    position: NonNullable<ReturnType<ConnectedVenue["projectPosition"]>>;
  } | null>(null);
  const replayActive = replay !== null;
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [availabilityTime, setAvailabilityTime] = useState(Date.now);
  const floors = useMemo(() => venue.floorsAt(availabilityTime), [venue, availabilityTime]);
  const previewDeadline = !replayActive && route?.status === "ready" ? route.value.data.validUntilMs : null;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state === "active") setAvailabilityTime(Date.now());
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!foreground) return;
    const nextMapChange = nextEdgeAvailabilityChange(pkg.graph.edges, availabilityTime);
    const nextRouteChange = previewDeadline != null && previewDeadline >= availabilityTime
      ? previewDeadline + 1 : Infinity;
    const next = Math.min(nextMapChange ?? Infinity, nextRouteChange);
    if (!Number.isFinite(next)) return;
    const delay = Math.min(2_147_483_647, Math.max(1, next - Date.now()));
    const timer = setTimeout(() => setAvailabilityTime(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [availabilityTime, foreground, pkg, previewDeadline]);
  useEffect(() => () => rerouteRef.current?.abort(), []);
  useEffect(() => {
    if (!replayActive || !foreground || showCorrection || routeExpired) return;
    const timer = setInterval(() => {
      const session = replayRef.current;
      if (!session || session.progress.status === "arrived" || session.progress.status === "off-route") return;
      const now = Date.now();
      if (hasExpired(session.route.validUntilMs, now) || hasExpired(session.detour?.validUntilMs, now)) {
        setRouteExpired(true);
        setReplayRoute(null);
        return;
      }
      if (session.progress.status === "confirm-floor") return;
      session.elapsed += 250;
      const detour = session.detour;
      let estimate = session.sample(session.progress.legIndex, session.elapsed - session.legStartedAt, session.elapsed);
      if (detour) {
        const { x, y, complete } = detour.sample(session.elapsed - detour.startedAt);
        estimate = { ...estimate, x, y };
        // Wait for an exact graph node before asking either router to recover.
        if (!complete) {
          const position = venue.projectPosition(estimate.floorId!, estimate.x, estimate.y);
          if (position) setReplay({ position, progress: session.progress });
          return;
        }
      }
      session.lastEstimate = estimate;
      session.progress = session.tracker.update(estimate, session.elapsed);
      if (!detour && session.detourRequested && session.progress.status === "following") {
        const branch = findSimulatedDetour(pkg, session.route, session.progress.legIndex, estimate, stepFree, Date.now());
        if (branch) {
          session.detour = {
            sample: createWalkSample(branch.polyline), startedAt: session.elapsed, validUntilMs: branch.validUntilMs,
          };
          session.detourRequested = false;
          setDetourRequested(false);
        }
      }
      const position = venue.projectPosition(estimate.floorId!, estimate.x, estimate.y);
      if (position) setReplay({ position, progress: session.progress });
      if (session.progress.status === "arrived") {
        session.detourRequested = false;
        setDetourRequested(false);
      }
    }, 125);
    return () => clearInterval(timer);
  }, [foreground, pkg, replayActive, routeExpired, showCorrection, stepFree, venue]);

  useEffect(() => {
    const term = query.trim();
    if (!term) return;
    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      const showMatches = (ids: string[]) => {
        const byId = new Map(venue.places.map((place) => [place.id, place]));
        const value = ids.flatMap((id) => {
          const place = byId.get(id);
          return place ? [place] : [];
        });
        setSearch({ status: "ready", value });
      };
      if (offline) {
        showMatches(searchCachedVenue(pkg, term));
        return;
      }
      try {
        const response = await client.search(venue.venueId, venue.mapVersionId, term, controller.signal);
        if (!controller.signal.aborted) showMatches(response.results.map((hit) => hit.poiId));
      } catch (error) {
        if (controller.signal.aborted) return;
        if (isUnavailable(error) && offlinePlanner) {
          navigationDiagnostics.record("search", "using-saved-map", error);
          setOffline(true);
          showMatches(searchCachedVenue(pkg, term));
        } else {
          navigationDiagnostics.record("search", "failed", error);
          setSearch({ status: "error", message: withRequestReference("Search couldn’t load. Try again.", error) });
        }
      }
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(debounce);
    };
  }, [client, offline, offlinePlanner, pkg, query, searchAttempt, venue]);

  useEffect(() => {
    if (!destination || replayActive) return;
    setRoute({ status: "loading" });
    const controller = new AbortController();
    async function request() {
      if (!destination) return;
      const requestBody = {
        mapVersionId: venue.mapVersionId,
        start: start.coordinates,
        destinationPoiId: destination.id,
        mode: stepFree ? "step_free" as const : "shortest" as const,
      };
      const showRoute = (data: Route) => {
        const segments = venue.routeSegments(data, start.point, start.coordinates.floorId, destination, stepFree);
        if (!controller.signal.aborted) setRoute({ status: "ready", value: { data, segments } });
      };
      try {
        if (stepFree && !pkg.graph.edges.every((edge) => typeof edge.isStepFree === "boolean")) {
          navigationDiagnostics.record("route", "failed");
          setRoute({ status: "error", message: "This map version does not include step-free route information." });
          return;
        }
        if (offline) {
          const data = offlinePlanner?.(requestBody, Date.now());
          if (data) showRoute(data);
          else {
            navigationDiagnostics.record("route", "failed");
            setRoute({ status: "error", message: stepFree
              ? "The saved map has no confirmed step-free route."
              : "The saved map has no walking route from this entrance." });
          }
        } else {
          showRoute(await client.calculateRoute(venue.venueId, requestBody, controller.signal));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!offline && isUnavailable(error) && offlinePlanner) {
          navigationDiagnostics.record("route", "using-saved-map", error);
          setRoute({ status: "loading" });
          setOffline(true);
          return;
        }
        navigationDiagnostics.record("route", "failed", error);
        const message = error instanceof PlatformApiError && error.status === 400
            ? (stepFree ? "No confirmed step-free route is available." : "No walking route is available from this entrance.")
            : "The walking route couldn’t load. Try again.";
        setRoute({ status: "error", message: withRequestReference(message, error) });
      }
    }
    void request();
    return () => controller.abort();
  }, [availabilityTime, client, destination, offline, offlinePlanner, replayActive, routeAttempt, start, stepFree, venue]);

  const selectDestination = (place: POIItem) => {
    if (replayActive) return;
    Keyboard.dismiss();
    if (destination?.id === place.id) return;
    setDestination(place);
    setRoute({ status: "loading" });
    setFloorLevel(start.floorLevel);
    setCameraMode("route");
  };
  const changeQuery = (value: string) => {
    if (query === value) return;
    setQuery(value);
    setSearch(value.trim() ? { status: "loading" } : { status: "ready", value: venue.places });
  };
  const preview = route?.status === "ready" && !hasExpired(route.value.data.validUntilMs, availabilityTime) ? route.value : null;
  function beginReplay(data: Route) {
    if (hasExpired(data.validUntilMs, Date.now())) {
      setAvailabilityTime(Date.now());
      return;
    }
    const tracker = createRouteProgress(venue.venueId, data.floors);
    const sample = createRouteReplay(data, venue.venueId);
    const estimate = sample(0, 0, 0);
    const position = venue.projectPosition(data.floors[0].floorId, estimate.x, estimate.y);
    if (!position) return;
    const progress = tracker.update(estimate, 0);
    replayRef.current = { tracker, sample, legStartedAt: 0, elapsed: 0, progress, route: data, lastEstimate: estimate };
    setReplayRoute(preview?.segments ?? null);
    setRouteExpired(false);
    setRerouteState(null);
    setReplay({ position, progress });
    setFloorLevel(position.level);
    setCameraMode("follow");
  }
  function confirmReplayFloor(floorId: string) {
    const session = replayRef.current;
    if (!session || routeExpired || hasExpired(session.route.validUntilMs, Date.now())) return;
    session.progress = session.tracker.confirmFloor(floorId);
    session.legStartedAt = session.elapsed;
    const estimate = session.sample(session.progress.legIndex, 0, session.elapsed);
    const position = venue.projectPosition(floorId, estimate.x, estimate.y);
    if (position) {
      setReplay({ position, progress: session.progress });
      setFloorLevel(position.level);
      setCameraMode("follow");
    }
  }
  function takeDetour() {
    const session = replayRef.current;
    if (!session || session.detour || session.detourRequested || session.progress.status !== "following") return;
    session.detourRequested = true;
    setDetourRequested(true);
    setRerouteState(null);
  }

  async function recoverRoute() {
    const session = replayRef.current;
    if (!session || !destination || rerouteRef.current || session.progress.status !== "off-route") return;
    const { floorId, x, y } = session.lastEstimate;
    if (!floorId) return;
    const origin = venue.projectPosition(floorId, x, y);
    if (!origin) return;
    const controller = new AbortController();
    rerouteRef.current = controller;
    setRerouteError(null);
    setRerouteState("working");
    try {
      const result = await requestReroute(client, offlinePlanner, venue.venueId, {
        mapVersionId: venue.mapVersionId, start: { floorId, x, y }, destinationPoiId: destination.id,
        mode: stepFree ? "step_free" : "shortest",
      }, { offline, signal: controller.signal, now: Date.now });
      if (controller.signal.aborted || replayRef.current !== session) return;
      if (result.offline && !offline) {
        navigationDiagnostics.record("reroute", "using-saved-map", result.fallbackError);
        setOffline(true);
      }
      if (!result.route) {
        navigationDiagnostics.record("reroute", "failed");
        setRerouteError(withRequestReference("A new route is unavailable.", result.fallbackError));
        setRerouteState("failed");
        return;
      }
      if (hasExpired(result.route.validUntilMs, Date.now())) {
        setRerouteError("A scheduled closure affected the replacement route. Try again.");
        setRerouteState("failed");
        return;
      }
      const segments = venue.routeSegments(result.route, origin.point, floorId, destination, stepFree);
      session.route = result.route;
      setRouteExpired(false);
      session.tracker = createRouteProgress(venue.venueId, result.route.floors);
      session.sample = createRouteReplay(result.route, venue.venueId);
      session.legStartedAt = session.elapsed;
      session.detour = undefined;
      session.detourRequested = false;
      setDetourRequested(false);
      session.progress = session.tracker.update(session.lastEstimate, session.elapsed);
      setReplayRoute(segments);
      setReplay({ position: origin, progress: session.progress });
      setFloorLevel(origin.level);
      setCameraMode("follow");
      setRerouteState("updated");
    } catch (error) {
      if (!controller.signal.aborted) {
        navigationDiagnostics.record("reroute", "failed", error);
        setRerouteError(withRequestReference("A new route is unavailable.", error));
        setRerouteState("failed");
      }
    } finally {
      if (rerouteRef.current === controller) rerouteRef.current = null;
    }
  }
  useEffect(() => {
    if (foreground && !showCorrection && replay?.progress.status === "off-route" && rerouteState === null) {
      void recoverRoute();
    }
  });
  function correctReplayPosition(entrance: ConnectedVenue["starts"][number], source: "manual" | "visual" = "manual") {
    const session = replayRef.current;
    if (!session || rerouteRef.current || session.progress.status === "arrived") return false;
    const { floorId, x, y } = entrance.coordinates;
    session.lastEstimate = {
      ...session.lastEstimate, floorId, x, y, headingDegrees: null, speedMps: null,
      horizontalAccuracyM: 1, confidence: "high", confidenceScore: 0.9, sourceContributions: [source],
    };
    session.detour = undefined;
    session.detourRequested = false;
    session.progress = { ...session.progress, status: "off-route", nextFloorId: undefined, nextTurn: undefined };
    setDetourRequested(false);
    setScannerOpen(false);
    setShowCorrection(false);
    setRerouteState(null);
    setReplay({ position: { point: entrance.point, level: entrance.floorLevel }, progress: session.progress });
    setFloorLevel(entrance.floorLevel);
    return true;
  }
  const nextReplayFloor = venue.floors.find((floor) => floor.id === replay?.progress.nextFloorId);
  const transition = preview?.data.transitions.find((item) =>
    venue.floors.some((floor) => floor.level === floorLevel && floor.id === item.fromFloorId),
  );
  const transitionFloor = venue.floors.find((floor) => floor.id === transition?.toFloorId);
  const floorButtons = venue.floors.map((floor) => (
    <Choice key={floor.id} theme={theme} label={floor.shortLabel}
      accessibilityLabel={`Show ${floor.name}`} selected={floor.level === floorLevel}
      onPress={() => {
        setFloorLevel(floor.level);
        setCameraMode(preview ? "route" : "floor");
      }} />
  ));

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      {scannerOpen && (
        <CheckpointScanner foreground={foreground} theme={theme} onClose={() => setScannerOpen(false)}
          onScan={(code) => {
            const entrance = resolveCheckpoint(venue, code);
            return entrance ? correctReplayPosition(entrance, "visual") : false;
          }} />
      )}
      <View style={[styles.venueHeading, { borderBottomColor: theme.line }]}>
        <View style={styles.headingText}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{venue.venueName}</Text>
          <Text style={{ color: theme.muted }}>
            {replayActive ? "Fictional venue · Simulated guidance" :
              offline ? "Offline · Closures may have changed" : "Fictional venue · Route preview"}
          </Text>
        </View>
        <View style={styles.choices}>{floorButtons}</View>
      </View>
      <View style={styles.map}>
        <IndoorMap
          theme={theme} venue={{ ...venue, floors, start: start.point }} places={venue.places}
          floorLevel={floorLevel} recenterKey={0} route={replay ? (replayRoute ? { segments: replayRoute } : null) : preview} destination={destination}
          position={replay?.position.point ?? start.point} positionFloor={replay?.position.level ?? start.floorLevel}
          reducedMotion={reducedMotion} navigating={replayActive}
          onSelectPOI={selectDestination} hasSheet={false} cameraMode={cameraMode}
          onPan={() => setCameraMode("manual")} topInset={0} sheetHeight={0}
        />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled"
        style={[styles.panel, { borderColor: theme.line, backgroundColor: theme.paper }]}
        contentContainerStyle={styles.panelContents}>
        {replay ? (
          <View style={[styles.summary, { backgroundColor: theme.accentSoft }]}>
            <Text accessibilityRole="header" style={[styles.label, { color: theme.ink }]}>Route simulation</Text>
            <Text accessibilityLiveRegion="polite" style={{ color: theme.inkSecondary }}>
              {routeExpired && replay.progress.status !== "off-route"
                ? "A scheduled closure has paused this route. Correct your position to find a new route."
                : replay.progress.status === "arrived" ? `Arrived at ${destination?.name}` :
                replay.progress.status === "confirm-floor" ? `Continue to ${nextReplayFloor?.name}` :
                replay.progress.status === "uncertain" ? "Waiting for a position on this floor" :
                replay.progress.status === "off-route" ? "Off route" :
                replay.progress.nextTurn
                  ? `Turn ${replay.progress.nextTurn.direction} in ${Math.ceil(replay.progress.nextTurn.distanceM)} m`
                  : "Continue along the route"}
            </Text>
            {!routeExpired && replay.progress.status !== "arrived" && (
              <Text style={{ color: theme.inkSecondary }}>
                {Math.ceil(replay.progress.remainingM)} m remaining · about {Math.max(1, Math.ceil(replay.progress.remainingM / 72))} min
              </Text>
            )}
            {!routeExpired && nextReplayFloor && <Choice theme={theme} label={`Confirm ${nextReplayFloor.name}`}
              onPress={() => confirmReplayFloor(nextReplayFloor.id)} />}
            {rerouteState === "working" && <Text style={{ color: theme.muted }}>Finding a new route…</Text>}
            {rerouteState === "updated" && (
              <Text accessibilityLiveRegion="polite" style={{ color: theme.inkSecondary }}>
                {offline ? "Route updated using the saved map" : "Route updated"}
              </Text>
            )}
            {rerouteState === "failed" && <>
              <Text accessibilityRole="alert" style={{ color: theme.danger }}>{rerouteError ?? "A new route is unavailable."}</Text>
              <Choice theme={theme} label="Retry reroute" onPress={() => void recoverRoute()} />
            </>}
            {rerouteState !== "working" && replay.progress.status !== "arrived" && (
              <Choice theme={theme} label={showCorrection ? "Cancel correction" : "Correct simulated position"}
                onPress={() => setShowCorrection((visible) => !visible)} />
            )}
            {showCorrection && rerouteState !== "working" && replay.progress.status !== "arrived" && (
              <View style={styles.choices}>
                <Choice theme={theme} label="Scan checkpoint" onPress={() => setScannerOpen(true)} />
                {venue.starts.map((entrance, index) => (
                  <Choice key={entrance.id} theme={theme} label={`${entrance.floorName} · Entrance ${index + 1}`}
                    onPress={() => correctReplayPosition(entrance)} />
                ))}
              </View>
            )}
            {!routeExpired && detourRequested && replay.progress.status === "following" && (
              <Text style={{ color: theme.muted }}>Waiting for a side corridor…</Text>
            )}
            {!routeExpired && !detourRequested && !replayRef.current?.detour && replay.progress.status === "following" &&
              <Choice theme={theme} label="Simulate a missed turn" onPress={takeDetour} />}
            <Choice theme={theme} label="Exit simulation" onPress={() => {
              rerouteRef.current?.abort();
              rerouteRef.current = null;
              replayRef.current = null;
              setReplay(null);
              setReplayRoute(null);
              setRouteExpired(false);
              setRerouteState(null);
              setDetourRequested(false);
              setShowCorrection(false);
              setScannerOpen(false);
              setCameraMode("route");
            }} />
          </View>
        ) : <>
        {stepFree && <Text style={{ color: theme.inkSecondary }}>Step-free routes preferred</Text>}
        <View style={styles.choices}>
          <Text style={{ color: theme.muted, alignSelf: "center" }}>
            {offline || map.saved
              ? `Last synced ${new Date(map.syncedAtMs).toLocaleString()}`
              : "Offline copy unavailable"}
          </Text>
          <Choice theme={theme} label="Sync map" onPress={onSync} />
        </View>
        {destination && (
          <View style={[styles.summary, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.label, { color: theme.ink }]}>{destination.name} · {destination.floorName}</Text>
            {route?.status === "loading" && <Text style={{ color: theme.muted }}>Finding a walking route…</Text>}
            {route?.status === "error" && (
              <>
                <Text accessibilityRole="alert" style={{ color: theme.danger }}>{route.message}</Text>
                <Choice theme={theme} label="Retry route" onPress={() => {
                  setRoute({ status: "loading" });
                  setRouteAttempt((previous) => previous + 1);
                }} />
              </>
            )}
            {preview && (
              <>
                <Text accessibilityLiveRegion="polite" style={{ color: theme.inkSecondary }}>
                  {Math.round(preview.data.distanceM)} m · {Math.max(1, Math.ceil(preview.data.estimatedTimeS / 60))} min
                </Text>
                {transition && transitionFloor && (
                  <Text style={{ color: theme.inkSecondary }}>
                    {transition.transitionType === "stairs" ? "Take the stairs" : `Take the ${transition.transitionType}`} to {transitionFloor.name}.
                  </Text>
                )}
                <Choice theme={theme} label="Simulate guidance" onPress={() => beginReplay(preview.data)} />
              </>
            )}
          </View>
        )}
        <Text style={[styles.label, { color: theme.ink }]}>Starting entrance</Text>
        <View style={styles.choices}>
          {venue.starts.map((item, index) => (
            <Choice key={item.id} theme={theme} label={`${item.floorName} · Entrance ${index + 1}`}
              selected={item.id === start.id} onPress={() => {
                if (item.id === start.id) return;
                setStart(item);
                setFloorLevel(item.floorLevel);
                setCameraMode(destination ? "route" : "floor");
                if (destination) setRoute({ status: "loading" });
              }} />
          ))}
        </View>
        <View style={[styles.search, { backgroundColor: theme.bg, borderColor: theme.line }]}>
          <Icon name="search" color={theme.muted} size={18} />
          <TextInput
            accessibilityLabel="Search test venue" placeholder="Search destinations"
            placeholderTextColor={theme.muted} value={query} onChangeText={changeQuery}
            autoCorrect={false} returnKeyType="search" style={[styles.input, { color: theme.ink }]}
          />
        </View>
        {search.status === "loading" && <ActivityIndicator color={theme.accent} accessibilityLabel="Searching" />}
        {search.status === "error" && (
          <>
            <Text accessibilityRole="alert" style={{ color: theme.danger }}>{search.message}</Text>
            <Choice theme={theme} label="Retry search" onPress={() => {
              setSearch({ status: "loading" });
              setSearchAttempt((previous) => previous + 1);
            }} />
          </>
        )}
        {search.status === "ready" && search.value.length === 0 && (
          <Text style={{ color: theme.muted }}>No matching destinations.</Text>
        )}
        {search.status === "ready" && search.value.map((place) => (
          <MotionPressable
            key={place.id} accessibilityRole="button"
            accessibilityState={{ selected: destination?.id === place.id }}
            onPress={() => selectDestination(place)}
            style={({ pressed }) => [styles.place, {
              borderColor: theme.line,
              backgroundColor: pressed || destination?.id === place.id ? theme.accentSoft : theme.paper,
            }]}
          >
            <View style={styles.headingText}>
              <Text style={[styles.label, { color: theme.ink }]}>{place.name}</Text>
              <Text style={{ color: theme.muted }}>{place.floorName}</Text>
            </View>
            <Icon name="arrow" color={theme.accent} size={18} />
          </MotionPressable>
        ))}
        </>}
      </ScrollView>
    </View>
  );
}

function Choice({ theme, label, accessibilityLabel, selected, onPress }: {
  theme: Theme; label: string; accessibilityLabel?: string; selected?: boolean; onPress: () => void;
}) {
  return (
    <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress} style={({ pressed }) => [styles.choice, {
        borderColor: selected ? theme.accent : theme.line,
        backgroundColor: pressed || selected ? theme.accentSoft : theme.paper,
      }]}>
      <Text style={{ color: selected ? theme.accent : theme.ink }}>{label}</Text>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  messageScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  venueHeading: { flexDirection: "row", alignItems: "center", padding: 16, gap: 8, borderBottomWidth: 1 },
  headingText: { flex: 1, gap: 4 },
  map: { flex: 1, minHeight: 124 },
  panel: { flex: 1, borderTopWidth: 1 },
  panelContents: { padding: 16, gap: 8 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 12 },
  summary: { padding: 12, gap: 4, borderRadius: 12 },
  label: { fontSize: 15, fontWeight: "600" },
  search: { flexDirection: "row", gap: 8, alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, minHeight: 44, fontSize: 16 },
  place: { flexDirection: "row", minHeight: 52, alignItems: "center", padding: 8, borderBottomWidth: 1 },
});
