# React Native / Expo (SDK 58-era, 2026) sensor, radio, ML, background and map-rendering stack for indoor positioning

Context for the reader: target app is Expo SDK 58 / React Native 0.88 / Reanimated 4 / react-native-svg / expo-sensors / expo-camera / AsyncStorage / expo-file-system, TypeScript. Since RN 0.82 the New Architecture is always on and cannot be disabled; Expo SDK 55+ does not support disabling it — [Expo New Architecture guide](https://docs.expo.dev/guides/new-architecture). So every library below must be New-Architecture (Fabric/TurboModule/JSI or Nitro/Expo-Modules) capable; anything "old-arch only" is effectively unusable for this app. Nearly every native library below also requires an Expo development build (not Expo Go).

Note on library metadata: GitHub pages fetched during this research render star counts and license but not release dates (GitHub's web UI hides them from the fetched markdown); where a "last release/commit year" could not be confirmed it is listed as a gap rather than guessed.

---

## 1. IMU sensors: expo-sensors vs react-native-sensors vs custom native module; 50–100 Hz streams; attitude / game-rotation-vector access

### Takeaway
expo-sensors' `DeviceMotion` is adequate for ~50–100 Hz on both platforms (iOS hardware caps CMMotionManager at "usually at least 100 Hz"; Android 12+ caps at 200 Hz without `HIGH_SAMPLING_RATE_SENSORS`), and each sub-reading carries its own timestamp, but it exposes only a single fused "rotation" without a selectable reference frame and does not expose Android's `GAME_ROTATION_VECTOR`. For a magnetometer-free attitude (game rotation vector on Android; `xArbitraryZVertical` on iOS) and for guaranteed per-sample timestamps with batching, write a small Expo Modules API (Swift/Kotlin) module; react-native-sensors is not a viable New-Arch option.

### Cited Findings
- expo-sensors `DeviceMotionMeasurement` fields: `acceleration` (m/s², excludes gravity), `accelerationIncludingGravity`, `rotation` {alpha (Z), beta (X), gamma (Y)}, `rotationRate` (deg/s), `interval` (ms), `orientation`; each of `acceleration`, `accelerationIncludingGravity`, `rotation`, `rotationRate` carries its own `timestamp`; there is no top-level timestamp. The page does not describe how `rotation` is computed (no reference-frame option). Available on Android, iOS, web and in Expo Go — [Expo DeviceMotion SDK 58 docs](https://docs.expo.dev/versions/v58.0.0/sdk/devicemotion.md)
- `setUpdateInterval(intervalMs)` is the "Desired interval in milliseconds between sensor updates" — a request, not a guarantee. "Starting from Android 12 (API level 31), the system has a 200Hz limit for each sensor updates"; to exceed it add `android.permission.HIGH_SAMPLING_RATE_SENSORS` to `app.json` permissions. iOS requires `NSMotionUsageDescription`, set via the config plugin's `motionPermission` — [Expo DeviceMotion SDK 58 docs](https://docs.expo.dev/versions/v58.0.0/sdk/devicemotion.md)
- Some Expo pages (Gyroscope, older README) write the same limit as "200ms", which contradicts the 200 Hz wording on DeviceMotion; 200 Hz = 5 ms so "200ms" looks like a doc error — [Expo Gyroscope docs](https://docs.expo.dev/versions/latest/sdk/gyroscope) vs [Expo DeviceMotion](https://docs.expo.dev/versions/v58.0.0/sdk/devicemotion.md)
- expo-sensors is actively released (changelog shows 15.0.7 on 2025-09-11) — [expo-sensors on yarnpkg](https://classic.yarnpkg.com/en/package/expo-sensors)
- iOS: Core Motion `deviceMotionUpdateInterval` — "The maximum update frequency is hardware dependent, but is usually at least 100 Hz. If you specify an update frequency greater than what the hardware supports, Core Motion uses the maximum frequency instead" — [Apple: deviceMotionUpdateInterval](https://developer.apple.com/documentation/coremotion/cmmotionmanager/devicemotionupdateinterval.md)
- WWDC23 notes contrast CMMotionManager (100 Hz max) with the newer `CMBatchedSensorManager` (200 Hz device motion, 800 Hz accelerometer) — [WWDC23 "What's new in Core Motion" notes](https://wwdcnotes.com/notes/wwdc23/10179) (note: CMBatchedSensorManager is a watchOS API in that session; treat as not applicable to iPhone unless verified)
- iOS attitude reference frames: `CMAttitudeReferenceFrame` options are `xArbitraryZVertical`, `xArbitraryCorrectedZVertical`, `xMagneticNorthZVertical`, `xTrueNorthZVertical`; check `availableAttitudeReferenceFrames` because magnetometer frames need magnetometer hardware (Apple page content not retrievable via fetch; frame names are confirmed indirectly by Reanimated's `iosReferenceFrame` option which lists arbitrary/corrected/magnetic-north/true-north Z-vertical) — [Reanimated useAnimatedSensor](https://docs.swmansion.com/react-native-reanimated/docs/device/useAnimatedSensor)
- Reanimated `useAnimatedSensor` supports ACCELEROMETER, GYROSCOPE, GRAVITY, MAGNETIC_FIELD, ROTATION; config `interval` (ms or `'auto'` = screen refresh rate), `adjustToInterfaceOrientation`, `iosReferenceFrame` (default Auto picks based on magnetometer presence); ROTATION returns roll/pitch/yaw (radians) plus quaternion qw/qx/qy/qz; data readable on UI and JS thread; iOS requires Location Services enabled; "Most of the sensors operate in resolutions up to 100Hz" — [Reanimated useAnimatedSensor](https://docs.swmansion.com/react-native-reanimated/docs/device/useAnimatedSensor)
- react-native-attitude v3.1.0: roll/pitch/heading, implemented as a Turbo Module, Core Motion + compass on iOS, rotation vector sensor on Android; v3.x requires RN 0.82+ with New Architecture — [react-native-attitude README](https://unpkg.com/react-native-attitude@3.1.0/README.md); [GitHub dpyeates/react-native-attitude](https://github.com/dpyeates/react-native-attitude)
- react-native-sensors (digital-dawn org repo as fetched): 0 stars on that mirror, accelerometer & gyroscope only, `updateInterval` defaults to 100 ms, no timestamp field, no New Architecture or Expo plugin mention, compatibility table stops at RN ≥ 0.40 — [GitHub digital-dawn/react-native-sensors](https://github.com/digital-dawn/react-native-sensors). (The canonical `react-native-sensors` repo is `react-native-sensors/react-native-sensors`; its current maintenance status and New-Arch support were not confirmed in this research — see Gaps.)
- Android `GAME_ROTATION_VECTOR` exists because "without a magnetometer, yaw will drift slowly"; none of the surveyed RN libraries documents exposing it — [newly.app rotation vector guide](https://newly.app/sensors/rotation-vector-sensor-mobile-apps) (secondary)
- Expo Modules API: "allows you to write Swift and Kotlin to add new capabilities"; modules "support the New Architecture" and are "automatically backwards compatible with existing React Native apps using the old architecture"; "similar performance characteristics to React Native's Turbo Modules API" (JSI, no JSON bridge); adds "a negligible impact on your app size"; choose Turbo Modules if you need C++, Expo Modules for developer experience — [Expo Modules API overview](https://docs.expo.dev/modules/overview.md); get-started guide at [docs.expo.dev/modules/get-started](https://docs.expo.dev/modules/get-started.md)
- Core Motion energy guidance: stop motion updates "when your app deactivates or enters the background" — [Apple Energy Guide: Motion best practices](https://developer.apple.com/library/archive/documentation/Performance/Conceptual/EnergyGuide-iOS/MotionBestPractices.html)

### Inferences
- For a PDR/INS front end at 100 Hz, expo-sensors `DeviceMotion` at `setUpdateInterval(10)` will work on iOS (hardware ≥100 Hz) and Android (<200 Hz cap), with per-field timestamps usable for dt computation. It is the lowest-effort path and is already in the app.
- expo-sensors delivers each sample as a separate JS event over the Expo event emitter; at 100 Hz that is 100 JS-thread events/sec, each a small object — acceptable but not ideal when a particle filter also runs on JS. A custom Expo Module that batches N samples into a typed array (and uses Android `SensorManager.registerListener` with `maxReportLatencyUs`, or iOS `CMMotionManager` with a chosen `CMAttitudeReferenceFrame`) gives: game-rotation-vector / arbitrary-Z attitude without magnetic disturbance, true sensor timestamps, batching, and the option to run fusion natively.
- Reanimated's `useAnimatedSensor` is the only off-the-shelf way to pick the iOS attitude reference frame from JS and to read sensors on the UI thread (useful for feeding a UI-thread worklet filter), but 'auto' interval is display-rate-bound and it is designed for animation, not logging.

### Gaps
- Could not fetch Apple's `CMMotionManager` or `CMAttitudeReferenceFrame` pages (JS-rendered); frame names are confirmed only via Reanimated docs.
- Maintenance status, stars, license and New-Arch support of the canonical `react-native-sensors/react-native-sensors` repo not confirmed (only an unrelated zero-star mirror was fetched).
- No source found quantifying expo-sensors DeviceMotion fusion quality (yaw drift, latency) or confirming which Android sensor (`ROTATION_VECTOR` vs `GAME_ROTATION_VECTOR`) it uses for `rotation`; read `expo-sensors/android/.../DeviceMotionModule.kt` to confirm.
- No measured data on JS-event overhead of expo-sensors at 100 Hz.

---

## 2. BLE scanning: react-native-ble-plx, react-native-ble-manager, forks and Nitro alternatives; Expo config plugins; iOS background limits; Android 12+ permissions; scan throttling; beacon libraries

### Takeaway
Three credible options exist in 2026: upstream `react-native-ble-plx` (3.4k stars, Apache-2.0, Expo plugin, New-Arch status not stated on README, community calls it "effectively unmaintained" for modern stacks), its maintained TurboModule fork `@sfourdrinier/react-native-ble-plx` 3.9.x (RN 0.86+/Expo 57+, Expo plugin, Android foreground-service BLE), and the Nitro-Modules-based `react-native-ble-nitro` (MIT, 148 stars, Expo plugin with `neverForLocation`, manufacturer-data in scan results). `react-native-ble-manager` 12.1.x also supports New Arch (RN 0.76+) with an Expo plugin. For positioning you must NOT set `neverForLocation` (it filters iBeacons and asserts you don't derive location); Android limits scan start/stop to 5 per 30 s and converts long scans to opportunistic; iOS background scanning coalesces duplicates and lengthens the scan interval, making RSSI-rate ranging in background impractical.

### Cited Findings
**Libraries**
- `react-native-ble-plx` (dotintent): 3.4k stars, Apache-2.0, latest changelog entry 3.2.0 (mentions Android 14), compatibility table lists RN 0.74.1 / 0.69.6 / Expo 51; Expo config plugin for SDK 43+ "tested against SDK 49", options `isBackgroundEnabled`, `neverForLocation`, `modes`, `bluetoothAlwaysPermission`; iOS background requires "Uses Bluetooth LE Accessories" mode plus `restoreStateIdentifier`/`restoreStateFunction`; documents Android 12+ BLUETOOTH_SCAN/BLUETOOTH_CONNECT vs legacy BLUETOOTH/BLUETOOTH_ADMIN (maxSdk 30), ACCESS_FINE_LOCATION, minSdk 23; no New Architecture statement on README — [GitHub dotintent/react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
- Separate Expo plugin package `@config-plugins/react-native-ble-plx` (latest 7.0.0 on Socket); since v5.0.0 it no longer sets `NSBluetoothPeripheralUsageDescription` because SDK 48+ targets iOS 13+ — [npm @config-plugins/react-native-ble-plx](https://www.npmjs.com/package/@config-plugins/react-native-ble-plx); [socket.dev](https://socket.dev/npm/package/@config-plugins/react-native-ble-plx)
- A 2026 third-party tutorial claims ble-plx "supports the New Architecture (Fabric plus Turbo Modules)" and recommends the config plugin with a dev build — [reactnativerelay.com tutorial](https://reactnativerelay.com/article/react-native-ble-plx-expo-tutorial-2026) (secondary, unverified against upstream)
- Fork `@sfourdrinier/react-native-ble-plx` 3.9.2: says upstream is "effectively unmaintained for modern React Native / Expo stacks"; requires RN 0.86.0+, Expo SDK 57+, Android min/compile/target 24/36/36, iOS 16.4; ships an RN 0.86 codegen TurboModule (`NativeBlePlx`/`BlePlxSpec`); TypeScript-first API; `ConnectionManager` with retries/auto-reconnect; iOS state restoration opt-in from 3.9.1; Expo config plugin; "Android foreground service background BLE"; license not stated in the FORK doc — [FORK.md](https://cdn.jsdelivr.net/npm/@sfourdrinier/react-native-ble-plx@3.9.2/docs/FORK.md); roadmap docs reference a future `unified-ble-manager` 4.0 — [ROADMAP.4.0.md](https://cdn.jsdelivr.net/npm/@sfourdrinier/react-native-ble-plx@3.9.2/ROADMAP.4.0.md)
- `react-native-ble-nitro` (zykeco): 148 stars, MIT, "built on Nitro Modules", direct JSI, New Architecture fully supported, docs reference releases up to 1.15.x; Expo plugin options `isBackgroundEnabled`, `modes`, `neverForLocation`, `bluetoothAlwaysPermission`, `androidAdvertisingEnabled`, `iOSLazyInit`; `startScan` supports service-UUID filter, RSSI threshold, `allowDuplicates`, `androidScanMode` (LowLatency/Balanced/LowPower/Opportunistic); iOS state restoration via `restoreIdentifier` + `onRestoredState`; scan results include manufacturer data keyed by company ID and service data keyed by UUID — [GitHub zykeco/react-native-ble-nitro](https://github.com/zykeco/react-native-ble-nitro)
- `react-native-ble-manager` (innoveit): New Architecture supported from RN 0.76 (version 12.x); Expo config plugin from 12.1.x; requires dev build; npm shows 12.1.4 — [npm react-native-ble-manager](https://www.npmjs.com/package/react-native-ble-manager); [README mirror](https://docsearch.algolia.com/mcp/docs/repo/innoveit/react-native-ble-manager)
- Native libraries cannot run in Expo Go — [Theodo blog on BLE with Expo](https://blog.theodo.com/2023/07/ble-integration-for-rn-apps)

**Beacon-specific libraries**
- `react-native-beacons-manager` (MacKentoch): iOS+Android iBeacon/Eddystone, `startRangingBeaconsInRegion`; last synced 2024-10-30 with 107 open issues; no 2025 release found — [ecosyste.ms listing](https://awesome.ecosyste.ms/projects/github.com%2Fmackentoch%2Freact-native-beacons-manager)
- `react-native-beacon-kit`: iBeacon, AltBeacon, Eddystone-UID (Android), New Architecture support claimed — [pkgstats react-native-beacon-kit](https://www.pkgstats.com/pkg:react-native-beacon-kit); `expo-beacon`: Expo module for iBeacon and Eddystone scanning — [pkgstats expo-beacon](https://www.pkgstats.com/pkg:expo-beacon) (both low-visibility; stars/license not confirmed)

**Android permissions and throttling**
- BLUETOOTH_SCAN/CONNECT/ADVERTISE are runtime permissions on Android 12+. An app that "uses scan results to derive physical location must declare ACCESS_FINE_LOCATION"; `neverForLocation` on BLUETOOTH_SCAN "asserts that the app never derives physical location from Bluetooth scan results", "may restrict the types of Bluetooth devices you can interact with", and allows scan results with location services off; on Android 10–11 background discovery requires ACCESS_BACKGROUND_LOCATION — [Android Bluetooth permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)
- `neverForLocation` "will result in some BLE beacons, such as iBeacons, being filtered from scan results" — [Novelbits Android BLE guide](https://learn.novelbits.io/getting-started-android-bluetooth-le-development)
- Scan throttling (undocumented, widely reproduced): "Since Nougat, every application is allowed to start/stop BLE scan a maximum of 5 times per 30s"; exceeding it silently delays scan start ~30 s without `onScanFailed`; long scans are converted to opportunistic scans (threshold raised from 5 to 30 minutes); libraries work around with ~6 s scan cycles; Android 12+ can surface `SCAN_FAILED_SCANNING_TOO_FREQUENTLY` (6) — [proandroiddev BLE journey](https://proandroiddev.com/to-find-a-beacon-without-losing-it-my-journey-into-a-realm-of-bluetooth-low-energy-on-android-aa3e2c2923aa); [Punch Through scan errors](https://punchthrough.com/android-ble-scan-errors/); [AltBeacon Huawei screen-off issue](https://lightrun.com/answers/altbeacon-android-beacon-library-huawei-blocks-scans-when-screen-is-off)

**iOS background**
- With `bluetooth-central` background mode: "The CBCentralManagerScanOptionAllowDuplicatesKey scan option key is ignored, and multiple discoveries of an advertising peripheral are coalesced into a single discovery event"; "If all apps that are scanning for peripherals are in the background, the interval at which your central device scans for advertising packets increases. As a result, it may take longer to discover an advertising peripheral." State preservation/restoration via `CBCentralManagerOptionRestoreIdentifierKey` and `centralManager:willRestoreState:` — [Apple Core Bluetooth background processing (archive)](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html)

### Inferences
- For Atlas (Expo 58 / RN 0.88), the upstream dotintent package's documented compatibility (RN 0.74/Expo 51) is two years stale; the `@sfourdrinier` fork (RN 0.86+/Expo 57+) or `react-native-ble-nitro` are the realistic choices. Nitro's manufacturer-data and service-data decoding in scan results covers iBeacon (Apple company ID 0x004C) and Eddystone (service UUID 0xFEAA) parsing in JS without a beacon-specific library; ranging math (RSSI → distance) is then yours.
- Because BLE positioning derives location, Atlas must request ACCESS_FINE_LOCATION alongside BLUETOOTH_SCAN and must not set `neverForLocation`; Play review will therefore treat BLE scanning as location use.
- On iOS, duplicate coalescing in background means at most one RSSI sample per beacon per scan cycle while backgrounded; continuous RSSI-based trilateration realistically works only foreground (or with the `location` background mode keeping the app running — see §7).
- On Android, keep one continuous scan running (don't start/stop per fix); use `LowLatency` mode in foreground; expect the system to downgrade a scan older than ~30 min.

### Gaps
- Could not confirm the release year of upstream `react-native-ble-plx` 3.2.0 or whether it has a formal New-Architecture (bridgeless) statement; check GitHub releases.
- License of the `@sfourdrinier` fork not shown in FORK.md (likely inherits Apache-2.0; unverified).
- iOS iBeacon ranging via Core Location (`CLBeaconRegion`/`CLBeaconIdentityConstraint`, ~1 Hz ranging callbacks) was not researched; no maintained Expo/New-Arch iBeacon-ranging module was confirmed.
- No measured data on CoreBluetooth foreground scan report rate or iOS RSSI sampling rate.

---

## 3. Wi-Fi scanning and Wi-Fi RTT from React Native (Android only)

### Takeaway
No RN library exposes `WifiRttManager`; `react-native-wifi-reborn` covers connecting/SSID (and basic scan lists) but not RTT, so RTT needs a custom Kotlin module. Android throttles `WifiManager.startScan()` to 4 scans per 2 minutes in foreground and 1 per 30 minutes for all background apps combined (Android 9+), so Wi-Fi scanning can only be a slow absolute-position correction, not a real-time source; iOS exposes neither Wi-Fi scan lists nor RTT.

### Cited Findings
- `react-native-wifi-reborn` is "based on the no longer maintained react-native-wifi"; README covers connecting to networks and reading SSID; no Wi-Fi RTT API found — [react-native-wifi-reborn README](https://unpkg.com/react-native-wifi-reborn@4.13.5/README.md); [socket.dev](https://socket.dev/npm/package/react-native-wifi-reborn/overview/2.0.2)
- Wi-Fi RTT: obtain via `Context.getSystemService(Context.WIFI_RTT_RANGING_SERVICE)`; `startRanging(RangingRequest, Executor, RangingResultCallback)`; check `isAvailable()` and listen for `ACTION_WIFI_RTT_STATE_CHANGED`; requires ACCESS_FINE_LOCATION, CHANGE_WIFI_STATE, ACCESS_WIFI_STATE, NEARBY_WIFI_DEVICES; device feature check `hasSystemFeature(FEATURE_WIFI_RTT)`; API level 28+ — [Android WifiRttManager reference](https://developer.android.com/reference/android/net/wifi/rtt/WifiRttManager); [Android Wi-Fi RTT guide](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- Wi-Fi scan throttling: "Android 9: Each foreground app can scan four times in a 2-minute period… All background apps combined can scan one time in a 30-minute period. Android 10 and higher: The same throttling limits… new developer option to toggle the throttling off for local testing (Developer Options > Networking > Wi-Fi scan throttling)". Android 10+ `startScan()` requires ACCESS_FINE_LOCATION + CHANGE_WIFI_STATE + location services on; `getScanResults()` requires ACCESS_FINE_LOCATION + ACCESS_WIFI_STATE; on Android 10+ apps can passively receive `SCAN_RESULTS_AVAILABLE_ACTION` broadcasts for scans issued by the platform or other apps — [Android Wi-Fi scanning overview](https://developer.android.com/develop/connectivity/wifi/wifi-scan)
- Sample Kotlin RTT app for reference — [Plinzen/android-rttmanager-sample](https://github.com/Plinzen/android-rttmanager-sample)

### Inferences
- A positioning engine should treat Wi-Fi scan results as an opportunistic absolute correction (fingerprint match) fired at most every ~30 s in foreground, plus passive consumption of other apps'/platform scans on Android 10+ (which does not count against the quota).
- Wi-Fi RTT ranging requests are not subject to the `startScan` quota but need RTT-capable APs (802.11mc/az) and a RTT-capable phone; the Kotlin module is ~200 lines via Expo Modules API, but device/AP coverage limits its value.
- iOS has no public API for Wi-Fi scan lists or RTT, so Wi-Fi is Android-only in the design.

### Gaps
- No source found quantifying what fraction of 2025–2026 Android phones support FEATURE_WIFI_RTT.
- Did not verify whether `react-native-wifi-reborn` supports New Architecture or has an Expo config plugin (README excerpt did not mention either).
- Android 14+ `NEARBY_WIFI_DEVICES` interaction with `neverForLocation` for Wi-Fi was not researched.

---

## 4. UWB from React Native (Android UWB Jetpack / iOS Nearby Interaction)

### Takeaway
There is no first-party or widely-used React Native UWB module in 2026; the only cross-platform wrapper found is a Capacitor plugin. Android's `androidx.core.uwb` and iOS Nearby Interaction must be bridged with a custom Expo Module, and device/beacon coverage remains narrow.

### Cited Findings
- Android UWB Jetpack dependency `androidx.core.uwb:uwb:1.1.0-alpha01`; `UwbManager` gets capabilities and handles ranging; supported devices listed as Pixel 6 Pro and newer Pro/Fold/Tablet plus some Samsung models (as of January 2025) — [Android UWB guide](https://developer.android.com/develop/connectivity/uwb); [androidx.core.uwb reference](https://developer.android.com/reference/androidx/core/uwb/package-summary)
- A September 2026 vendor guide states neither React Native nor Expo ships a UWB module and claims the Jetpack library reached 1.0.0 in May 2026 — conflicts with the 1.1.0-alpha01 shown in official docs — [newly.app UWB Android guide](https://newly.app/guides/ultra-wideband-android) (secondary)
- `@capgo/capacitor-uwb` wraps iOS Nearby Interaction and Android Jetpack UWB — for Capacitor, not RN — [Capgo UWB plugin](https://capgo.app/docs/plugins/uwb/)
- Estimote publishes an Android UWB SDK using Bluetooth + Core UWB Jetpack to discover and range with UWB beacons; a community repo adapts it for RN/Expo — [Estimote Android UWB SDK](https://www.github.com/Estimote/Android-Estimote-UWB-SDK); [estimote-uwb-sample-app](https://awesome.ecosyste.ms/projects/github.com%2Fmaskedalkindi%2Festimote-uwb-sample-app)
- `react-native-nearby-modern` exists on npm (Nearby-related; UWB scope unclear) — [npm react-native-nearby-modern](https://www.npmjs.com/package/react-native-nearby-modern)

### Inferences
- UWB is a Phase-3+ option for Atlas: requires custom Swift (NearbyInteraction, `NISession` with accessory configuration data from a UWB anchor over BLE) and Kotlin (`UwbManager` controlee session) modules plus UWB anchors; phone penetration (Pixel Pro/Fold, Samsung flagships, iPhone 11+) is partial.

### Gaps
- Stars/license/maintenance for `react-native-nearby-modern` and the Estimote RN sample not confirmed.
- No iOS Nearby Interaction RN wrapper found at all.

---

## 5. ARCore / ARKit from RN/Expo; VIO pose or ARCore Geospatial as a positioning source; Expo Modules API for native code

### Takeaway
ViroReact (`@reactvision/react-viro`) is the only maintained RN AR renderer in 2026, requires New Architecture, iOS 15.1+, a dev build (no Expo Go); `react-native-arkit` is dormant (last 0.9.0, manual install). For positioning you do not need a renderer — a thin Expo Module that runs an `ARSession`/ARCore `Session` and streams the 6-DoF camera pose (and optionally ARCore Geospatial/VPS pose) to JS is the lean approach, but the camera must be on and ARCore Geospatial requires fine location, Google Cloud API enablement, and VPS coverage (sparse indoors).

### Cited Findings
- ViroReact supports ARKit (iOS), ARCore (Android) and Meta Horizon OS; works with RN CLI and Expo projects; maintained version requires New Architecture (Fabric); an Oct-2026 guide cites v3.0.3 (7 Oct 2026), iOS deployment target 15.1, not usable in Expo Go; npm readme shows v2.55.0 (version discrepancy) — [npm @reactvision/react-viro stats](https://pkgstats.com/pkg:@reactvision/react-viro); [ReactVision docs mirror](https://docsearch.algolia.com/mcp/docs/repo/reactvision/viro); [newly.app AR apps guide](https://newly.app/guides/ar-apps) (secondary)
- `react-native-arkit` (HippoAR / react-native-ar org): MIT, newest version 0.9.0, README warns automatic install fails (missing PocketSVG), no archive notice or recent release found — [react-native-arkit README](https://cdn.jsdelivr.net/npm/react-native-arkit@0.9.0/README.md); [ecosyste.ms repo listing](https://repos.ecosyste.ms/hosts/GitHub/repositories/react-native-ar/react-native-arkit)
- ARCore Geospatial API "relies on VPS in low-GPS-accuracy places like indoor spaces"; VPS availability can be checked for a lat/lng before starting a session; requires ARCore API enabled in a Google Cloud project; "cannot run with coarse location only" — fine location is mandatory — [ARCore check VPS availability](https://developers.google.com/ar/develop/c/geospatial/check-vps-availability); [ARCore enable Geospatial](https://developers.google.com/ar/develop/c/geospatial/enable?authuser=7)
- ARCore SDK v1.34.0+ exposes geospatial pose orientation and conversions between geospatial and world-space poses — [ARCore Android SDK v1.34.0 release](https://www.github.com/google-ar/arcore-android-sdk/releases/tag/v1.34.0)
- Geospatial on iOS is available via ARCore Extensions (documented for Unity AR Foundation) — [ARCore Geospatial iOS (Unity)](https://developers.google.cn/ar/develop/unity-arf/geospatial/enable-ios)
- Expo Modules API supports Swift/Kotlin native modules and views with New Architecture support and TurboModule-like JSI performance — [Expo Modules API overview](https://docs.expo.dev/modules/overview.md)

### Inferences
- A "pose-only" Expo Module (no rendering) avoids the ViroReact dependency: iOS `ARSession` with `ARWorldTrackingConfiguration` emitting `camera.transform` at 60 Hz; Android ARCore `Session.update()` → `Frame.camera.pose`. VIO drift is low over tens of metres and can be fused with QR-code checkpoints (which Atlas already scans via expo-camera) as absolute fixes — but expo-camera and an ARSession cannot share the camera simultaneously, so the AR module would own the camera and also do QR detection (ARKit image/`Vision` barcode, ARCore + ML Kit).
- ARCore Geospatial/VPS is unlikely to help indoors except near windows/entrances in Street-View-covered areas; treat as an outdoor-to-indoor handoff aid.

### Gaps
- Could not verify ViroReact's current version (2.55 vs 3.0.3), license, or stars from a primary source.
- No source found on anyone exposing raw ARKit/ARCore pose to RN without a renderer; no battery or CPU figures for a background-less AR pose stream.
- react-native-vision-camera + ARKit pose integration: no results.

---

## 6. On-device ML for inertial models (RoNIN/TLIO-style): react-native-executorch, react-native-fast-tflite, onnxruntime-react-native

### Takeaway
All three run on-device inference without JS-thread copies: `react-native-fast-tflite` (1.2k stars, MIT, Nitro Modules, zero-copy ArrayBuffers, `runSync`, CoreML/GPU/NNAPI delegates, Expo plugin) is the most direct for a small 1-D-CNN/LSTM inertial model; `react-native-executorch` (1.8k stars, Software Mansion, XNNPACK/Core ML/MLX/Vulkan, RN 0.83+/Expo 55+, iOS 17+, New Arch required, depends on react-native-worklets, "bring your own .pte") is the PyTorch-native route; ONNX Runtime RN exists but its 2026 Expo/New-Arch status was not confirmed. No published latency numbers for inertial models on RN were found.

### Cited Findings
- `react-native-fast-tflite` (mrousavy): 1.2k stars, MIT, "built with Nitro Modules", "Zero-copy ArrayBuffers", direct TFLite C/C++ core API; delegates: CoreML (iOS), `'android-gpu'` (OpenCL; "Android does not officially support OpenCL, but most GPU vendors do"), `'nnapi'` ("NNAPI is deprecated on Android 15. GPU delegate is preferred"), Metal/OpenGL mentioned; Expo config plugin options `enableCoreMLDelegate`, `enableAndroidGpuLibraries`; `model.runSync([inputBuffer])` and async `model.run`; inputs/outputs are raw ArrayBuffers (user interprets e.g. Float32Array); no benchmark numbers; release date not visible — [GitHub mrousavy/react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite)
- `react-native-executorch` (Software Mansion): 1.8k stars; requires "React Native 0.83+ or Expo SDK 55+" with development builds, `react-native-worklets` >=0.10.0 <0.14.0, iOS 17.0+, Android 8.0+ (minSdk 26), New Architecture enabled; "Expo Go is not supported"; backends XNNPACK (CPU), Core ML and MLX (Apple), Vulkan (Android GPU); supports "bring your own .pte models" and custom pipelines with low-level tensor operations; license not shown in fetched content — [GitHub software-mansion/react-native-executorch](https://github.com/software-mansion/react-native-executorch)
- Expo blog on react-native-executorch: pre-exported models on Hugging Face; names CoreML (Neural Engine) and Vulkan backends; example Whisper Tiny ~150 MB downloaded and cached; generic claim "about 50 tokens/second on a flagship phone versus about 5 on a mid-range device" (LLM, not inertial) — [Expo blog](https://expo.dev/blog/how-to-run-ai-models-with-react-native-executorch)
- ExecuTorch "is Meta's inference engine that powers on-device AI features in Instagram and Facebook"; architecture docs describe CPU/GPU/NPU backends — [react-native-executorch architecture docs (mirror)](https://www.mintlify.com/software-mansion/react-native-executorch/core-concepts/architecture)
- Model formats: ExecuTorch needs `.pte`; fast-tflite uses `.tflite` — [dev.to on-device AI RN](https://dev.to/eira-wexford/how-to-integrate-on-device-ai-models-in-react-native-apps-337d) (secondary)
- A vendor comparison argues ONNX Runtime's generality makes it "less optimized for the dominant use case of 2026: on-device LLM inference" — [cactuscompute comparison](https://cactuscompute.com/compare/best-onnx-runtime-alternative) (competitor marketing)
- An April 2026 TildAlice series benchmarked TFLite vs ONNX on ARM devices (contents not retrievable) — [buttondown TildAlice](https://buttondown.com/ckae930413/archive/tflite-vs-onnx-mobile-5-arm-devices-12ms-gap/)

### Inferences
- RoNIN-style models are small (ResNet-1D/LSTM on 200-sample windows of 6-DoF IMU) and run comfortably on CPU (XNNPACK) in a few ms; GPU/NNAPI delegates add setup latency and are unnecessary. fast-tflite's synchronous `runSync` on a Float32 ArrayBuffer is the simplest fit for a 1–5 Hz velocity-estimate cadence; it can be called from a Worklet runtime because Nitro objects are JSI host objects (verify—see Gaps).
- react-native-executorch's hard dependency on `react-native-worklets` 0.10–0.13 must be checked against the Reanimated 4 / worklets version Atlas already ships to avoid a version clash.
- Train in PyTorch → export both `.pte` (ExecuTorch, XNNPACK) and `.tflite` (via ai-edge-torch/ONNX) to keep both runtimes open.

### Gaps
- No published latency figures for any inertial (RoNIN/TLIO) model on RN; no head-to-head RN benchmark of the three runtimes.
- `onnxruntime-react-native` npm page returned 403; current version, license (MIT expected), Expo plugin and New-Arch status unconfirmed.
- react-native-executorch docs for custom `.pte` execution (`useExecutorchModule` / `ExecutorchModule`) returned 404 at the guessed URLs; the exact low-level tensor API is unverified.
- Whether fast-tflite/Nitro model objects are callable from a non-UI worklet runtime thread was not confirmed.

---

## 7. Background execution: screen-off positioning on Android (foreground service) and iOS (background modes); expo-task-manager / expo-background-task; battery figures

### Takeaway
`expo-background-task` (BGTaskScheduler/WorkManager) is for periodic deferred jobs and is useless for live positioning. The only Expo-supported way to keep an app running with the screen off is `expo-location`'s `startLocationUpdatesAsync` with a `foregroundService` (Android, FOREGROUND_SERVICE_LOCATION, Android 14+) and `UIBackgroundModes: location` (iOS); on iOS, Core Motion updates stop seconds after backgrounding unless a Core Location session is active, and both stores subject this to background-location review. Realistic battery cost from published measurements: continuous BLE scanning ≈ 94–154 mA or ≥200 mW; full location SDKs report 2–8 %/h total device drain.

### Cited Findings
- expo-background-task uses BGTaskScheduler on iOS; the system decides when to run based on battery, network and usage; a minimum interval can be set but runs may be delayed; Expo uses a single worker because both OSes cap scheduled tasks; not available in iOS simulator; `triggerTaskWorkerForTestingAsync` for testing — [Expo BackgroundTask SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/background-task/); [Expo blog: goodbye background fetch](https://expo.dev/blog/goodbye-background-fetch-hello-expo-background-task)
- expo-location background: continues while backgrounded, stops when user terminates app; Android does not auto-restart on location events, vendor behaviour varies; iOS restarts for geofence events; Expo Go: no iOS background location, Android Expo Go has no foreground/background services → dev build required; task must be defined at top level with `TaskManager.defineTask`; iOS needs `location` in `UIBackgroundModes`. `LocationTaskOptions.foregroundService` {notificationTitle, notificationBody, notificationColor, killServiceOnDestroy}; iOS `activityType` (Other/AutomotiveNavigation/Fitness/OtherNavigation/Airborne), `pausesUpdatesAutomatically` (default false), `showsBackgroundLocationIndicator`, deferred-update options. Android permissions: ACCESS_BACKGROUND_LOCATION (Play review required), FOREGROUND_SERVICE + FOREGROUND_SERVICE_LOCATION ("required on Android 14 and later", Play review also required); Android 11+ `requestBackgroundPermissionsAsync` opens system settings; iOS `Always` via `requestBackgroundPermissionsAsync` after foreground, silently fails after "Allow Once". Config plugin: `isAndroidBackgroundLocationEnabled`, `isIosBackgroundLocationEnabled`, `isAndroidForegroundServiceEnabled` (default true if background enabled), `androidForegroundServiceIcon`, `locationAlwaysAndWhenInUsePermission` — [Expo Location SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/location.md)
- Android 14: apps must declare foreground service types; `location` type requires FOREGROUND_SERVICE_LOCATION — [Android 14 FGS types](https://developer.android.com/about/versions/14/changes/fgs-types-required); Play Console requires a foreground-service-type declaration for apps targeting Android 14+ — [Play Console FGS declaration](https://support.google.com/googleplay/android-developer/answer/16965181)
- Conflict: HERE SDK docs say ACCESS_BACKGROUND_LOCATION is not required when using a location foreground service — [HERE SDK background updates](https://docs.here.com/here-sdk/docs/android-get-locations-enable-background-updates); Google Navigation SDK guidance says from Android 14 apps must have ACCESS_BACKGROUND_LOCATION or starting a location FGS throws SecurityException — [Google Maps Navigation SDK background location](https://developers.google.com/maps/documentation/navigation/android-sdk/background-location-usage). (Android's rule: a location FGS started while the app is in background needs background permission; started from foreground it does not — this reconciliation is my inference, not from a fetched page.)
- Google Play: "if an app's use of device location via foreground service is equivalent to ACCESS_BACKGROUND_LOCATION… the app will be subject to location in the background permissions requirements" — declaration form, video demonstration, prominent in-app disclosure — [Play location permissions policy](https://support.google.com/googleplay/android-developer/answer/9799150?hl=en)
- iOS Core Motion in background: forum measurements (iOS 26.5.2) report CMMotionManager device-motion updates stop within seconds of backgrounding "unless a Core Location session is running at the same time" — [Apple Developer Forums thread 841001](https://developer.apple.com/forums/thread/841001); older SO answers describe the same location-mode workaround — [SO: accelerometer in background](https://kaweah.freedombox.rocks/kiwix/content/stackoverflow.com_en_all_2023-11/questions/20729668/continuous-accelerometer-updates-while-in-the-background-on-ios); Apple's `CMMotionActivityManager` doc: "updates are not delivered while your app is suspended" — [Apple startActivityUpdates](https://developer.apple.com/tutorials/data/documentation/coremotion/cmmotionactivitymanager/startactivityupdates(to:withhandler:).md)
- iOS: location updates stop after the user force-quits from the app switcher — [Apple Developer Forums thread 770939](https://developer.apple.com/forums/thread/770939)
- Apple guideline 2.5.4: "Multitasking apps may only use background services for their intended purposes: VoIP, audio playback, location, task completion, local notifications, etc." — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Battery: OnePlus 6 receiving BLE at 200 Hz drew ~154 mA/h vs ~94 mA at 45 Hz; CPU 6 % → 1 % — [arXiv 2102.03351](https://arxiv.org/pdf/2102.03351); continuous BLE scanning as a background service measured at ≥200 mW on commodity phones — [core.ac.uk paper](https://core.ac.uk/download/35456499.pdf); vendor claim: BLE ≈1–3 % of battery per 24 h — [Pointr blog](https://www.pointr.tech/blog/bluetooth-low-energy-ble-use-phone-data-battery); HyperTrack reports 2–8 %/h total device drain with its SDK active — [HyperTrack](https://stories.hypertrack.com/zero-battery-location-tracking/); a 2025 IPIN workshop paper benchmarks IMU vs CV vs ARKit battery on iOS (numbers not retrieved) — [CEUR-WS Vol-4047 short27](https://ceur-ws.org/Vol-4047/short27.pdf)

### Inferences
- Architecture for screen-off turn-by-turn: start `Location.startLocationUpdatesAsync` with an Android foreground service (notification required) and iOS `location` background mode; this keeps the process alive so BLE scanning (coalesced on iOS) and IMU (iOS: continues only while CL session active) keep flowing. The indoor engine itself does not need GPS fixes—the location session is the "keep-alive".
- Store risk is real: both Apple (2.5.4/5.1.x) and Google (background-location declaration + video) will require that background positioning be a visible user feature (e.g., voice turn-by-turn with screen off). If Atlas can deliver navigation foreground-only (screen on, `keepAwake`), it avoids the declaration entirely.
- `killServiceOnDestroy: true` avoids the Android "zombie" notification after swipe-kill but also ends positioning.

### Gaps
- No primary Apple document found stating CMMotionManager background behaviour; evidence is forum/SO.
- No published battery figures for a combined IMU 100 Hz + BLE + map-matching workload on 2025–2026 phones.
- Expo's foreground service in `expo-location` — whether it can be started without any location-provider updates (pure keep-alive) was not confirmed.

---

## 8. Performance architecture: particle filter / map matching in a JSI worklet runtime vs native Kotlin/Swift module vs JS thread; reference indoor-nav RN SDKs

### Takeaway
Reanimated 4 / react-native-worklets lets you run a long-lived filter on a dedicated background JS runtime via `createWorkletRuntime` + `runOnRuntime` (separate thread, mutex-locked JSI, event loop, timers), isolating it from React rendering and animations; `runOnUI` is for short UI-thread work only. Every commercial RN indoor SDK (Situm, Pointr, IndoorAtlas, Navigine, Proximi.io) runs the positioning engine natively and bridges results; Mappedin is map-only (WebView). Choose worklet-runtime JS/TS for speed of iteration and a native module only if profiling shows the filter + sensor ingestion saturates a core.

### Cited Findings
- `runOnUI` "lets you asynchronously run workletized functions on the UI thread"; worklets are "short-running JavaScript functions that can run on the UI thread" — [Reanimated worklets guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets)
- `createWorkletRuntime(config?)` returns `{name, runtimeId}`; options `name`, `initializer` (worklet run synchronously on creation), `animationQueuePollingRate` (default 16 ms), `enableEventLoop` (default true: timers, requestAnimationFrame, queueMicrotask), `enableNetworking` (since 0.13.0: fetch/XHR), `enableLocking` (since 0.12.0: every JSI op wrapped in a mutex), `queue` ('default' | custom C++ AsyncQueue | null); "a separate JS runtime for running worklet functions, possibly on threads other than the JS or UI thread"; only `performance.now` and `console.*` installed by default; native only (no web) — [react-native-worklets createWorkletRuntime](https://docs.swmansion.com/react-native-worklets/docs/threading/createWorkletRuntime)
- `runOnRuntime` lets you "asynchronously run workletized functions on a separate worklet runtime on a separate thread" — [Reanimated 3 runOnRuntime](https://docs.swmansion.com/react-native-reanimated/docs/threading/runOnRuntime); in Reanimated 4 these are "deprecated in React Native Reanimated and users should import them directly from `react-native-worklets`" — [Reanimated 4 worklet-functions](https://tessl.io/registry/tessl/npm-react-native-reanimated/4.1.0/files/docs/worklet-functions.md)
- Worklets 0.5.0 added the option to pass a custom AsyncQueue to a WorkletRuntime — [worklets 0.5.0 release](https://newreleases.io/project/github/software-mansion/react-native-reanimated/release/worklets-0.5.0)
- react-native-executorch requires `react-native-worklets` >=0.10.0 <0.14.0, indicating ML inference designed to run inside worklet runtimes — [GitHub react-native-executorch](https://github.com/software-mansion/react-native-executorch)
- Situm `@situm/react-native`: 45 stars, MIT, 2,193 commits; requires `react-native-webview` (map viewer) and `maps.situm.com` in `WKAppBoundDomains` for offline; iOS needs `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSMotionUsageDescription` ("giroscope, accelerometer and altimeter"); Android ACCESS_FINE_LOCATION, minSdk 21; no Expo plugin or New-Arch statement — [GitHub situmtech/react-native](https://github.com/situmtech/react-native)
- Mappedin `@mappedin/react-native-sdk` v6.x wraps its web engine in a WebView (requires react-native-webview); map layer only — [Mappedin RN SDK README](https://cdn.jsdelivr.net/npm/@mappedin/react-native-sdk@6.21.1/README.md); Mappedin pairs with external IPS for blue dot — [Mappedin IPS integration](https://www.mappedin.com/resources/blog/ips-integration/)
- Pointr: `react-native-pointr` (third-party listing shows 9.3.1); wraps native iOS/Android SDKs; access token from Pointr support — [Pointr RN install guide (8.x docs)](https://docs-dev.pointr.tech/docs/8.x/Developer%20Portal/Pointr%20Mobile%20SDK/Guides/Installation%20Guide%20for%20react-native-pointr%20NPM%20Package); [pkgstats react-native-pointr](https://www.pkgstats.com/pkg:react-native-pointr)
- IndoorAtlas: docs list a React Native SDK with changelog; only unofficial npm wrappers found (`react-native-indoor-atlas` v0.3.1 "Unofficial") — [IndoorAtlas docs](https://docs.indooratlas.com); [pkgstats react-native-indoor-atlas](https://www.pkgstats.com/pkg:react-native-indoor-atlas)
- Proximi.io RN: "you will need to utilize the native components and build your own wrapper" — [Proximi.io RN docs](https://proximi.io/docs/react-native); Navigine RN wrapper exists — [npm react-native-navigine](https://www.npmjs.com/package/react-native-navigine); Wemap RN visual-positioning SDK claims 1–3 m accuracy — [Wemap positioning](https://getwemap.com/en/developers/positioning/) (vendor claim)

### Inferences
- Recommended split: (a) sensor ingestion + optional native batching in an Expo Module (Kotlin/Swift); (b) PDR + particle filter + map matching in TypeScript on a `createWorkletRuntime({ name: 'positioning' })` thread fed via `runOnRuntime`, with `enableNetworking: false` and results posted to React via `runOnJS` or a SharedValue at ≤10 Hz; (c) ML inference (fast-tflite / executorch) invoked from the same runtime if their JSI objects are thread-safe (verify). This keeps a 1,000–5,000-particle filter off both the UI and React JS threads.
- Worklet runtimes cannot call React Native native modules (only JSI host objects captured in closure), so the BLE/IMU libraries' event emitters must be bridged: subscribe on the JS thread, forward typed arrays with `runOnRuntime`, or implement the sensor module as a JSI/Nitro object callable from the runtime.
- The commercial SDKs confirm that native engines are the industry norm, but for a 100-Hz PDR + ~2k-particle filter, a JSI runtime on Hermes is likely sufficient; measure before going native.

### Gaps
- No benchmark found of particle-filter or map-matching throughput on a Hermes worklet runtime vs native.
- Whether Nitro/fast-tflite or expo-sensors emitters can be consumed directly inside a worklet runtime was not confirmed.
- Pointr/IndoorAtlas official RN package versions, licenses and New-Arch status unconfirmed (docs sites only).

---

## 9. Map rendering: @maplibre/maplibre-react-native with Expo (New Architecture) vs react-native-svg / @shopify/react-native-skia for custom floor plans

### Takeaway
`@maplibre/maplibre-react-native` v11 (676 stars, MIT, New-Architecture-only, Expo config plugin, peer `expo >=54`, actively released through v11.5.1 Oct 2026, MapLibre Native 13.6.1/6.31.0) is the production choice for tiled indoor maps with level filtering via style expressions; for a custom floor-plan canvas with hundreds of polygons and 60 fps interaction, Skia (GPU, UI-thread via JSI) is favoured over react-native-svg (rebuilds paths per touch; best for static vectors), though no quantitative 100-polygon benchmark exists.

### Cited Findings
- maplibre-react-native: 676 stars, MIT, "Interactive vector tile maps with MapLibre Native in Expo and React Native", Android + iOS — [GitHub maplibre/maplibre-react-native](https://github.com/maplibre/maplibre-react-native)
- v11 "is the first release to exclusively support React Native's new architecture"; APIs reworked to follow MapLibre GL JS — [MapLibre newsletter Apr 2026](https://maplibre.org/news/2026-05-02-maplibre-newsletter-april-2026/); [v11 migration guide](https://maplibre.org/maplibre-react-native/docs/setup/migrations/v11)
- Package peer deps `"expo": ">=54.0.0"`, `"react-native": ">=0.80.0"` — [package.json 11.3.3](https://cdn.jsdelivr.net/npm/@maplibre/maplibre-react-native@11.3.3/package.json)
- Releases: v11.5.1 (29 Oct 2026, Android NativeUserLocation fix), v11.5.0 (4 Oct 2026, feature-state API), v11.4.1 (SPM target fix), v11.4.0 (19 Sep 2026, MapLibre Native 13.6.1 Android / 6.31.0 iOS), v11.3.7 (22 Aug 2026, Expo config-plugin import fix), plus ANR/deadlock and GeoJSONSource fixes — [GitHub releases](https://github.com/maplibre/maplibre-react-native/releases)
- react-native-svg "is optimized for static SVGs and targets the native Android and iOS SVG platforms"; Skia sponsored by Shopify — [Shopify Engineering: Getting started with RN Skia](https://shopify.engineering/getting-started-with-react-native-skia)
- Claim: Skia handles path mutation on the GPU whereas react-native-svg rebuilds its internal path representation on every touch event — [Silversky blog](https://medium.com/@silverskytechnology/using-react-native-skia-to-build-more-than-just-svgs-a5bc1d6022c5) (secondary)
- Skia renders on the UI thread via JSI (no bridge) — [pkgpulse Skia vs SVG 2026](https://www.pkgpulse.com/guides/react-native-skia-vs-react-native-svg-vs-react-native-2026) (secondary)
- Margelo profiling on low-end Android: Skia GPU composition is a major cost; performance is device-dependent — [Margelo: profiling Skia + Reanimated on low-end Android](https://blog.margelo.com/profiling-skia-reanimated-low-end-android)
- Candlestick-chart precedent: per-view drawing janks, Skia canvas stays smooth with thousands of candles — [vp0 Skia chart](https://vp0.com/blogs/candlestick-chart-skia-react-native-high-performance-free-ios-template-vibe-codi) (secondary)
- @shopify/react-native-skia current line is 2.4.x on npm — [socket.dev react-native-skia 2.4.20](https://socket.dev/npm/package/@shopify/react-native-skia/overview/2.4.20)

### Inferences
- Atlas already uses react-native-svg; for a static floor plan with a moving blue dot and a highlighted route, keep SVG for the static layer (memoised) and drive only the position marker/route with Reanimated-animated props. Move to Skia (single `<Canvas>`, `Path` objects built once, transform via SharedValue) if pan/zoom/rotate of 100+ polygons drops below 60 fps on low-end Android.
- MapLibre RN v11 is viable for Atlas' stack (Expo 58 ≥ 54 peer, New Arch mandatory anyway): indoor levels via a `level` property and `filter` expressions on fill/line layers, `fill-extrusion` for 3D, GeoJSONSource for live route; the Oct-2026 feature-state API enables hover/selection without re-uploading GeoJSON.

### Gaps
- No published benchmark of react-native-svg vs Skia with ~100–500 polygons during continuous pan/zoom.
- MapLibre RN indoor-layer (level switching) specifics and offline-pack API in v11 were not verified.
- Skia stars/license/last-release date not fetched (MIT and very active per general knowledge; unverified here).

---

## 10. Store policy: Apple and Google rules for location, Bluetooth, motion permissions; "Always" location; iOS privacy manifests

### Takeaway
Apple requires purpose strings that "clearly and completely describe your use of the data" (5.1.1(ii)), forbids manipulating consent (5.1.1(iv)), restricts background modes to intended purposes (2.5.4), and location to directly relevant features (5.1.5); privacy manifests (enforced since May 1 2024) cover only five "required reason" API categories—none of which are Core Motion, Bluetooth or Core Location—so for Atlas the manifest work is mostly inherited from Expo/RN packages. Google Play treats BLE/Wi-Fi scanning used for positioning as location, requires a declaration + video + in-app disclosure for background location (including FGS-based), and a foreground-service-type declaration for Android 14+ targets.

### Cited Findings
- App Store Review Guidelines: 5.1.1(i) privacy policy link required; 5.1.1(ii) "Apps that collect user or usage data must secure user consent… Ensure your purpose strings clearly and completely describe your use of the data"; 5.1.1(iv) "Apps must respect the user's permission settings and not attempt to manipulate, trick, or force people to consent to unnecessary data access"; 2.5.4 background services only for intended purposes (VoIP, audio, location, task completion, local notifications…); 5.1.5 "Use Location Services in your app only when it is directly relevant… notify and obtain consent before collecting, transmitting, or using location data… explain the purpose in your app" — [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Rejection under 5.1.1(iv) reported for a custom pre-prompt screen with a "Not Now" button before the system location dialog — [Apple Developer Forums thread 817672](https://developer.apple.com/forums/thread/817672)
- If reviewers aren't convinced background location is justified, rejection may cite 2.5.4; apps need visible features depending on background location — [HyperTrack App Store submission guide](https://www.hypertrack.com/docs/prepare-for-app-store-submission) (vendor)
- Privacy manifests: since May 1, 2024 App Store Connect rejects apps not describing required-reason API use — [Bitrise](https://www.bitrise.io/blog/post/enforcement-of-apple-privacy-manifest-starting-from-may-1-2024); categories: file timestamp, system boot time, disk space, active keyboards, User Defaults; reasons from a closed list — [Apple: Describing use of required reason API](https://developer.apple.com/tutorials/data/documentation/bundleresources/describing-use-of-required-reason-api.md)
- Expo: configure via `expo.ios.privacyManifests` (`NSPrivacyAccessedAPITypes` with type + reasons, e.g. UserDefaults `CA92.1`); Expo SDK packages that use these APIs ship their own `PrivacyInfo`; for other libraries check `node_modules/<pkg>/ios/PrivacyInfo.xcprivacy`; "Apple does not reliably parse privacy files from static CocoaPods dependencies" so declare their reasons yourself; TestFlight external testing surfaces missing reasons by email — [Expo Apple privacy guide](https://docs.expo.dev/guides/apple-privacy.md)
- Android: Bluetooth scanning that derives location must declare ACCESS_FINE_LOCATION; `neverForLocation` only if the app never derives location — [Android Bluetooth permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)
- Google Play background-location policy: approval via permission declaration form, video demonstration, prominent in-app disclosure; FGS-based location equivalent to background location is covered; unapproved apps may have updates blocked or be removed; Google asks whether background location is central to core functionality — [Play policy 9799150](https://support.google.com/googleplay/android-developer/answer/9799150?hl=en)
- Android 14+ targets: declare foreground service types in Play Console "App content" — [Play FGS declaration 16965181](https://support.google.com/googleplay/android-developer/answer/16965181); Android 14 `location` FGS type requires FOREGROUND_SERVICE_LOCATION — [Android 14 FGS types](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- Wi-Fi scanning on Android 10+ requires ACCESS_FINE_LOCATION and location services enabled; background location access "should be critical to the core functionality… accompanied with proper disclosure" — [Android Wi-Fi scanning](https://developer.android.com/develop/connectivity/wifi/wifi-scan)
- iOS "Always" flow in Expo: request foreground first, then `requestBackgroundPermissionsAsync`; fails silently after "Allow Once" — [Expo Location SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/location.md)

### Inferences
- Required Info.plist strings for Atlas: `NSLocationWhenInUseUsageDescription` (+ `NSLocationAlwaysAndWhenInUseUsageDescription` only if background nav ships), `NSBluetoothAlwaysUsageDescription`, `NSMotionUsageDescription`, `NSCameraUsageDescription` (QR). Each should explicitly say "to show your position inside the building"; generic strings risk 5.1.1 rejection.
- Android manifest: BLUETOOTH_SCAN (no `neverForLocation`), BLUETOOTH_CONNECT if connecting, ACCESS_FINE_LOCATION, ACCESS_WIFI_STATE/CHANGE_WIFI_STATE/NEARBY_WIFI_DEVICES if Wi-Fi scanning, HIGH_SAMPLING_RATE_SENSORS if >200 Hz, plus FOREGROUND_SERVICE/FOREGROUND_SERVICE_LOCATION/ACCESS_BACKGROUND_LOCATION only if screen-off navigation ships — each of the latter triggering Play declarations and a demo video.
- Core Motion, Bluetooth and Core Location are not required-reason APIs, so Atlas' privacy-manifest obligations reduce to aggregating UserDefaults/FileTimestamp/etc. reasons from Expo, AsyncStorage, expo-file-system and any static-framework BLE/ML libraries, and to accurate Data-Safety / Privacy-Nutrition labels for "Precise Location" and "Sensors".

### Gaps
- Apple's own guidance on when "Always" location is approved versus "When In Use" was not found as primary text (only forum/vendor accounts).
- Google Play's specific Data Safety treatment of BLE/Wi-Fi-derived indoor position (vs GPS) not researched.
- Whether any surveyed BLE/ML library ships a `PrivacyInfo.xcprivacy` was not checked.
