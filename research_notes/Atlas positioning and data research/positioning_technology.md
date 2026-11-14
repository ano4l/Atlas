# Smartphone Indoor Positioning: State of the Art (2024–2026) and Open-Source Implementations

Research date: 2026-11-14. Scope: techniques usable by a consumer smartphone app (React Native/Expo + Kotlin backend) in a shopping mall with little or no owner-installed hardware. Each key question is covered below. Where a source is older than 2024 it is marked as such. "Infrastructure" notes state whether the app owner must install anything.

Conventions used in the project notes table:
- Lic = license; Lang = language; Status = maintenance signal observed (GitHub pages do not expose last-commit dates to the fetch tool, so "last commit year" is given only where a release/README date or copyright year was visible — treat as approximate).

---

## Key Question 1: Pedestrian dead reckoning (PDR) — step detection, heading, learned inertial models, drift

### Takeaway
Classic step+heading PDR remains the backbone of every winning smartphone system, but it is always wrapped in a particle filter with map constraints and corrected by an absolute source (Wi-Fi/BLE/magnetic). Learned inertial odometry (RoNIN, TLIO and successors) is open source, Python/PyTorch, research-grade, and still drifts; no source found gives a validated on-phone, in-mall drift-per-100 m figure for 2025–26.

### Cited Findings
- RoNIN (ICRA 2020) code: GPL-3.0, Python/PyTorch, 432 stars, 5 commits, ships pre-trained ResNet/LSTM/TCN position networks and a body-heading network; only ~50% of the dataset was published "due to security concerns" (data DOI 10.20383/102.0543) — [Sachini/ronin](https://github.com/Sachini/ronin)
- TLIO (2020): code at CathIAS/TLIO, Python, 414 stars, 91 commits; pipeline = train displacement network -> TorchScript -> EKF; the dataset download is labelled cc-by-nc; licence file exists but name not visible in fetch — [CathIAS/TLIO](https://github.com/CathIAS/TLIO)
- TLIO paper (2020, dated) reports it "reduces average yaw and position drift by 27% and 33% respectively" versus the best RoNIN baseline on its own test set — [TLIO arXiv](https://arxiv.org/pdf/2007.01867)
- StarIO (July 2025) states that existing data-driven inertial odometry methods "often suffer from significant drift under complex nonlinear motion patterns (e.g., turns)" — [StarIO arXiv 2507.16121](https://arxiv.org/html/2507.16121v2)
- A 2025 secondary summary claims MambaIO reduces ATE 15–30% over RoNIN/TLIO; not verified against the primary paper — [emergentmind IO topic](https://api.emergentmind.com/topics/inertial-odometry-io)
- Standard PDR chain described in recent literature: step detection + stride-length from accelerometer, heading from gyroscope yaw increments — [arXiv 2109.11706 (2021, dated)](https://arxiv.org/pdf/2109.11706)
- 2025 paper (ISPRS IJGI 14(12):476): map-aided particle-filter PDR with a pre-built vectorised floor plan and reduced state space, motivated by the cost of classic approaches that "usually need many particles and map boundaries" — [MDPI IJGI 2025](https://www.mdpi.com/2220-9964/14/12/476) (full text returned HTTP 403 to the fetch tool; numbers unverified)
- One recent study reports mean PDR error 2.97 ± 1.04 m on 238 m paths, reduced to 0.35 ± 0.07 m with a map-matching particle filter (single study, venue dates flagged as unusual by the search summary; treat with caution) — [JRSGR article](https://jrsgr.sru.ac.ir/article_12603_e4a8bff6c70e416428e7568371bc83a5.pdf)
- A particle-filter map-matching approach "can effectively solve the wall-crossing problem" for pocket-worn phones (pre-2024) — [MDPI IJGI 9(2):93 (2020)](https://mdpi.com/2220-9964/9/2/93)
- 2024 arXiv work for blind travellers used both an "Azimuth/Steps" PDR and RoNIN as the motion model under a particle filter — [arXiv 2401.08021](https://arxiv.org/pdf/2401.08021)
- IPIN 2025 Track 1 (onsite smartphone) sole listed competitor THWS & cronn: modular CONDENSATION particle filter fusing BLE/Wi-Fi, with step and turn detection to survive total radio outage, running in real time on the phone — [IPIN 2025 competitors](https://evaal.isti.cnr.it/2025/competitors)
- IPIN 2025 Track 3 entrant IPIN_CUMT: PDR + Wi-Fi/BLE fingerprinting (CAE-UMAP-IWKNN) + Wi-Fi-assisted heading correction + dual-branch CNN floor classifier + map-constrained graph optimisation — [IPIN 2025 competitors](https://evaal.isti.cnr.it/2025/competitors)

### Inferences
- For the Atlas stack, the practical 2026 recipe is: keep the existing step+heading PDR, add gyro-bias/heading correction from map geometry (corridor direction priors), and fuse through a particle filter with corridor-graph constraints — this is exactly what the competition-winning teams do.
- Running RoNIN/TLIO on-device is feasible (TLIO exports TorchScript) but both are GPL/non-commercial-flavoured and trained on specific phone-carriage datasets; expect to retrain. Learned models mainly help when the phone is in a pocket/bag (no steps visible); for handheld navigation their advantage is smaller.

### Gaps
- No 2025–26 source gives a validated drift rate (m per 100 m or % of distance) for RoNIN/TLIO on consumer phones in malls.
- TLIO code licence name not retrievable from the fetched page.
- IPIN 2024/2025 Track 1 and Track 3 official error figures were not found (results pages not surfaced by search; only scoring rules).

---

## Key Question 2: Wi-Fi — RTT (802.11mc/az) on Android, accuracy, iOS limits, RSSI fingerprinting

### Takeaway
Wi-Fi RTT is Android-only, delivers ~1–2 m median when 3+ RTT-capable APs are in view, and needs enterprise APs (Cisco/Aruba/Google) that most malls will not have unless the landlord's WLAN already supports FTM. iOS exposes no Wi-Fi scan/RSSI API at all, so Wi-Fi (RTT or fingerprinting) cannot be a cross-platform primary source; Android Wi-Fi RSSI fingerprinting is also throttled to 4 scans / 2 min.

### Cited Findings
- Android docs: ranging to 3+ APs with multilateration is "typically accurate within 1-2 meters"; Wi-Fi RTT introduced Android 9 (API 28); 802.11az non-trigger-based ranging added in Android 15 (API 35); requesting device does not need to associate; foreground only (background throttled); needs NEARBY_WIFI_DEVICES (API 33+) or ACCESS_FINE_LOCATION — [Android Wi-Fi RTT guide](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- APs can return their own position via LCI/LCR (ResponderLocation, Android 10+) so an app can locate itself in an unknown building if APs are configured — [Android Wi-Fi RTT guide](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- Supported AP list is enterprise-class: Cisco 9130/9136/9166/9164 (mc), Cisco CW9172/CW9176/CW9178 (mc/az), Aruba AP-5xx/6xx (mc), Aruba AP734/735/754/755 (mc/az), Google Nest Wifi/Nest Wifi Pro (mc) — [Android Wi-Fi RTT guide](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- Supported phones include Pixel 1–9 series, many Samsung Galaxy S/A/Note models, many Xiaomi models, LG — [Android Wi-Fi RTT guide](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- Sept 2026 arXiv: five commodity Android phones on a live campus WLAN (APs placed for coverage, not ranging), 10 static points over a 50 m x 30 m floor incl. NLOS/multipath: median 1.21 m, 90th percentile 2.68 m with weighted NLLS, no calibration; residual errors vary per AP so "a single global correction is insufficient" — [arXiv 2609.13795](https://arxiv.org/abs/2609.13795)
- 2025 TU Berlin: taking the minimum RTT across four channels cut median ranging error from 120 cm to 30 cm and worst case from 15 m to 10 m; COTS hardware often misses FTM's meter-level promise under strong multipath — [Roesler 2025](https://www.tkn.tu-berlin.de/bib/roesler2025improving/roesler2025improving.pdf)
- IMDEA multipath-aware tracking (pre-2024): median 2-D error ~2.0–3.4 m across four testbeds — [IMDEA TNET](https://dspace.networks.imdea.org/bitstream/handle/20.500.12761/400/TNET2700430.pdf?sequence=1)
- Press claims for 802.11az: sub-metre "down to 0.4 m"; not independently benchmarked; many Wi-Fi 6/6E APs need firmware updates — [TechWire Asia 2024](https://techwireasia.com/2024/11/how-android-15-wi-fi-ranging-will-change-indoor-maps/); [Dataconomy 2024](https://dataconomy.com/2024/11/11/android-15-wi-fi-ranging-explained)
- Vendor review (May 2025) says Wi-Fi RTT reaches only ~30% of Android users and no iOS users (figure unsourced) — [Crowd Connected review](https://www.crowdconnected.com/blog/indoor-positioning-tech-update-2021)
- Android 16 (API 36) adds android.ranging.RangingManager with technologies UWB, BLE_CS, WIFI_NAN_RTT (802.11mc), BLE_RSSI; WIFI_STA_RTT added in 36.1; WIFI_PD (Wi-Fi Proximity Detection) in API 37 — [RangingManager reference](https://developer.android.com/reference/android/ranging/RangingManager)
- iOS: Apple engineer on dev forums — iOS has no general-purpose Wi-Fi scanning API; apps can only see the SSID of the connected network; private frameworks lead to App Store rejection (threads 2012–2023, dated but no change found) — [Apple forums 65129](https://developer.apple.com/forums/thread/65129); [Apple forums 78559](https://developer.apple.com/forums/thread/78559)
- ArcGIS Indoors confirms "WiFi-based IPS from Apple is not supported"; iOS positioning uses Bluetooth beacons — [Esri docs](https://doc.esri.com/en/arcgis-indoors/latest/mobile/enable-indoor-positioning.html)
- Android scan throttling since Android 9: foreground apps 4 scans per 2-minute window, background 1 scan per 30 min; Developer-options toggle only; Google confirmed "here to stay" (2019) — [WiFiAnalyzer wiki](https://github.com/VREMSoftwareDevelopment/WiFiAnalyzer/wiki/Android-Wi%E2%80%90Fi-scanning-throttling); [Android Police 2019](https://www.androidpolice.com/2019/07/10/android-started-heavily-throttling-wi-fi-scanning-in-pie-google-confirms-its-here-to-stay)
- Microsoft Indoor Location Competition 2.0 (2021, dated): 1,170 teams, 204 buildings (Chinese malls), Wi-Fi + geomagnetic + iBeacon + waypoints; top team mean error 1.50 m (offline, post-processed, with path smoothing) — [Hu et al. MobiCom 2023 via HIT](https://scholar.hit.edu.cn/en/publications/the-wisdom-of-1170-teams-lessons-and-experiences-from-a-large-ind/); [MSR dataset page](https://www.microsoft.com/en-us/research/?p=766744); Navigine's graph particle filter entry reported 5.1–5.4 m on the same data — [Navigine/Hackernoon](https://sia.hackernoon.com/how-a-small-randd-team-achieved-great-results-in-the-kaggle-competition-without-using-ml-algorithms-w813371e)

### Inferences
- Infrastructure: Wi-Fi RTT needs 0 extra hardware only if the mall's WLAN is already Cisco Catalyst 91xx/CW91xx or Aruba 5xx+ with FTM enabled, and the venue shares AP coordinates (or configures LCI). Otherwise it is effectively a hardware install.
- For Atlas: treat Wi-Fi RTT as an opportunistic Android-only "bonus" source behind a capability check (FEATURE_WIFI_RTT + isAvailable), and never as the iOS story. Wi-Fi RSSI fingerprinting at 4 scans/2 min (~1 fix per 30 s) is only good as a slow absolute corrector for PDR drift on Android.
- The 2026 campus study is the most relevant "no-new-hardware" datapoint: ~1.2 m median is achievable where enterprise APs exist, but only after per-AP software calibration.

### Gaps
- No independent 2025–26 measurement of 802.11az on phones + APs found; sub-metre is a vendor/press claim.
- Share of mall WLANs (by region) with FTM-capable APs: no data found.

---

## Key Question 3: BLE — beacon trilateration vs fingerprinting, AoA (5.1), Channel Sounding (6.0)

### Takeaway
BLE beacons are the only radio source that works on both iOS and Android, but they are owner-installed infrastructure (~7–35 beacons per 1,000 m² depending on target accuracy). RSSI trilateration gives ~2–5 m; fingerprinting/particle-filter fusion gives ~1–3 m. AoA has no native phone receiver support; Channel Sounding reached iPhone 17 (iOS 27, N1 chip) and Android 16's RangingManager, but needs Bluetooth 6.x anchors that barely exist in 2026.

### Cited Findings
- Beacon density vs accuracy (academic): 1 beacon / 30 m² -> <2.6 m error at 95%; 1 beacon / 100 m² -> <4.8 m at 95% — [ISC inventory record](https://search.isc.ac/inventory/49/3602168.htm); transmitter density is a major accuracy factor — [ICCW 2019](https://unpaywall.org/10.1109%2FICCW.2019.8756989)
- Vendor rule of thumb (Mapsted): 1–5 beacons per 150 m² for coverage and navigation-grade accuracy — [Mapsted](https://mapsted.com/indoor-location-technologies/ble-positioning)
- Low-complexity BLE systems can reach <1 m with good filtering and placement (journal claim) — [JAISE AIS-210607](https://content.iospress.com:443/articles/journal-of-ambient-intelligence-and-smart-environments/ais210607)
- BLE RSSI commonly cited at ~1–2 m in a mixed Wi-Fi/BLE study; the same source notes newer smartphones restrict Wi-Fi scans, degrading Wi-Fi IPS — [MDPI Sensors 23(12):5684](https://mdpi.com/1424-8220/23/12/5684)
- Situm: positioning is probabilistic over noisy signals; publishes a beacon placement guide; advises against a device being connected to Wi-Fi during use — [Situm support](https://situm.freshdesk.com/support/solutions/articles/35000084827)
- iOS beacon ranging: CoreLocation didRange delivers RSSI/accuracy per beacon; Apple recommends monitoring a region first then ranging; CLBeaconRegion obsoleted for CLBeaconIdentityCondition in iOS 17 — [Apple ranging-for-beacons](https://developer.apple.com/documentation/corelocation/ranging-for-beacons.md); [Apple forums 787033](https://developer.apple.com/forums/thread/787033)
- iOS 20-monitored-region cap and ~1 Hz ranging callbacks come from a 2014 Stack Overflow thread (dated, secondhand) — [SO 25387660](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/25387660/ibeacon-region-monitoring-and-proximity-for-20-beacons)
- AoA/AoD: Nordic states "at this time smartphones do not support Bluetooth Direction Finding" (page undated) — [Nordic](https://www.nordicsemi.com/Products/Low-power-short-range-wireless/Direction-finding); iPhone AoA exists only via vendor apps paired to proprietary anchors (WiTagg AntBLE, iOS 15+) — [App Store](https://apps.apple.com/hu/app/antble/id1620976703); Bluetooth SIG calls CS and AoA complementary — [Bluetooth SIG blog](https://www.bluetooth.com/blog/true-distance-awareness-with-bluetooth-channel-sounding/)
- Channel Sounding on iPhone: iOS 27 adds CS; accessories must support Bluetooth 6.3; only iPhones with the N1 chip (iPhone 17 lineup) — [Novel Bits newsletter, June 2026](https://newsletter.novelbits.io/archive/ios-27-brings-channel-sounding-to-the-iphone/); Apple's NIDeviceCapability.supportsBluetoothChannelSounding exists and CS only works with accessories paired through AccessorySetupKit (search summary of Apple doc; page body not fetchable) — [Apple doc](https://developer.apple.com/documentation/nearbyinteraction/nidevicecapability/supportsbluetoothchannelsounding.md)
- Nordic forum: nRF54L CS with iOS 27 beta "not always successful... fails with a configuration error" (single anecdote) — [Nordic DevZone](https://devzone.nordicsemi.com/f/nordic-q-a/128469/nrf54l-channel-sounding-on-ios-27-beta/568003)
- Android: RangingManager.BLE_CS constant added in API 36 (Android 16) — [RangingManager](https://developer.android.com/reference/android/ranging/RangingManager); Pixel 10 reportedly has CS hardware but feature "not exposed" (press) — [Pulse](https://www.pulse.bot/consumer-tech/news/your-iphone-is-getting-enhanced-bluetooth-tracking-with-ios-27-but-theres-a-catch-489b5dd5-9777-4535-94f8-549d5bcfc25b/)
- CS accuracy "up to a few tens of centimetres" (vendor) — [Avnet](https://www.avnet.com/americas/resources/article/bluetooth-channel-sounding-takes-positioning-to-a-new-level/)
- React Native BLE libraries: react-native-ble-plx (TypeScript, v3.5.0 Feb 2025, needs dev build not Expo Go) — [react-native-ble-plx](https://socket.dev/npm/package/react-native-ble-plx); react-native-ble-manager (New Architecture, Expo config plugin from 12.1.x) — [react-native-ble-manager](https://docsearch.algolia.com/mcp/docs/repo/innoveit/react-native-ble-manager)

### Inferences
- For a mall of 1,000 m² of walkable corridor: ~7 beacons (1/150 m²) gives coarse zone-level; ~10 (1/100 m²) gives ~5 m; ~33 (1/30 m²) gives ~2.5 m at 95%. Corridor-graph map matching lets the sparser deployments work because lateral error is absorbed by the graph.
- Fingerprinting beats trilateration in malls (glass, metal shopfronts, crowds) but requires a survey; a hybrid — trilateration with per-beacon path-loss calibration plus particle-filter map matching — avoids the survey.
- AoA is not viable for a consumer app in 2026. Channel Sounding is worth tracking for 2027+ but today covers iPhone 17 + a handful of Android 16 flagships, and anchors with BT 6.3 are rare.

### Gaps
- No published mall-scale 2025–26 benchmark comparing BLE trilateration vs fingerprinting on the same phones.
- No official Google list of Android phones with app-exposed Channel Sounding.
- Current Apple documentation for the 20-region limit and background ranging rules was not retrieved.

---

## Key Question 4: UWB on phones — venue positioning or only peer ranging?

### Takeaway
Phone UWB (Android Jetpack core-uwb, Apple Nearby Interaction) is designed for peer/accessory ranging with an out-of-band BLE handshake per anchor; venue positioning is possible only with purpose-built UWB anchors (Estimote, Mobile Knowledge, Qorvo/Murata modules), is foreground-centric, and is limited to a small set of flagship phones. It is a hardware install, not a zero-infrastructure option.

### Cited Findings
- Android UWB: "currently only available using Jetpack" (androidx.core.uwb); ranging accuracy ~10 cm; Controller/Controlee model — a Controller can handle multiple Controlees, but a Controlee subscribes to a single Controller; parameter exchange must use an OOB channel (BLE); foreground required unless device supports background ranging, and no ranging reports are delivered in background — [Android UWB guide](https://developer.android.com/develop/connectivity/uwb)
- Device support as of Jan 2025: Pixel Pro (6 Pro+), Fold, Tablet; Motorola Edge 50 Ultra; Samsung Note 20, S21+/Ultra and newer Plus/Ultra, Z Fold2+; partner SDKs listed: Estimote UWB Development Kit, Mobile Knowledge MK UWB Kit (as of April 2023, Jetpack 1.0.0-alpha04) — [Android UWB guide](https://developer.android.com/develop/connectivity/uwb)
- Android 16 RangingManager unifies UWB with other technologies (API 36) — [RangingManager](https://developer.android.com/reference/android/ranging/RangingManager)
- Apple: from iOS 15, UWB iPhones interact with third-party accessories following the Nearby Interaction Accessory Protocol; sessions start by exchanging configuration over a data link (BLE GATT) — [Apple Nearby Interaction](https://developer.apple.com/documentation/nearbyinteraction.md); background ranging with accessories added at WWDC22 and requires the "Nearby Interaction" UIBackgroundModes entry — [WWDC22 notes](https://wwdcnotes.com/documentation/wwdc22-10008-whats-new-in-nearby-interaction/)
- Developer reports: background sessions get invalidated; Estimote says background ranging needs newer beacon firmware; direction data missing on U2 iPhones (15 Pro/16 Pro) with Murata SR040/SR150 accessories — [Apple forums 807519](https://developer.apple.com/forums/thread/807519); [Estimote forum](https://forums.estimote.com/t/does-estimote-uwb-work-when-app-is-closed-or-in-background/12168); [Apple forums 802948](https://www.developer.apple.com/forums/thread/802948)
- Estimote pitches downlink-TDoA (DL-TDoA) UWB positioning where phones listen to anchors; requires known anchor coordinates — [Estimote DL-TDoA](https://estimote.com/dl-tdoa); Eforthink also announced UWB DL-TDoA for smartphones (PR, June 2026) — [Novel Bits newsletter](https://newsletter.novelbits.io/archive/ios-27-brings-channel-sounding-to-the-iphone/)
- Nomtek prototype (2022, dated): real-time phone UWB ranging is power-hungry; few Android phones had UWB — [Nomtek](https://www.nomtek.com/labs/uwb-art-guide)
- Typical UWB ranging <30 cm, reliable indoor range ~10 m — [newly.app](https://newly.app/sensors/uwb-mobile-apps)

### Inferences
- Anchor count: at ~10 m reliable range and needing 3+ anchors in LOS per fix, a 1,000 m² open floor needs roughly 10–16 UWB anchors; corridors need fewer per m² but one every ~15–20 m per side. This is a significant install plus power/cabling — not aligned with Atlas's "little hardware" constraint.
- Cross-platform UWB venue positioning in 2026 requires a vendor SDK (Estimote/Pointr-style) because Android Jetpack and Apple NI each need their own OOB handshake protocol; no open-source anchor firmware + phone SDK stack was found.

### Gaps
- No open-source, cross-platform UWB venue-positioning stack identified.
- Apple's current official rules on multi-accessory concurrent sessions and background were not retrievable (docs page body did not load).

---

## Key Question 5: Visual positioning — ARCore Geospatial/ARKit, open VPS/SLAM, indoor feasibility

### Takeaway
Phone VIO (ARKit/ARCore) gives excellent short-range relative tracking (~0.02 m/s drift for ARKit in a 2022 benchmark) and is a strong candidate to replace/aid step-based PDR when the camera is up, but absolute indoor localisation needs a venue map: Google's VPS only covers Street-View-mapped areas, and open stacks (hloc, ORB-SLAM3) are server/desktop research tools, not mobile SDKs.

### Cited Findings
- ARCore Geospatial API VPS is built from Street View imagery; "when VPS can localize the device, it can often offer precise sub-meter positional accuracy" (vendor claim); indoor use works only within VPS coverage — [Android XR Geospatial](https://developer.android.com/develop/xr/jetpack-xr-sdk/arcore/geospatial); [Google VPS availability](https://developers.google.cn/ar/develop/unity-arf/geospatial/check-vps-availability?hl=ko); [Geospatial overview](https://developers.google.com/ar/develop/geospatial)
- 2022 benchmark (Sensors; dated): ARKit on iPhone 12 Pro Max most stable, drift ~0.02 m/s; ARCore (LG V60) more accurate at endpoint in a long corridor but matched the floor plan poorly — [PMC9785098](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9785098/)
- ADVIO (2018; dated) shopping-mall sequences: ARKit 95th-percentile error ~10 m with few failures; ARCore occasionally failed from wrong loop closures — [ADVIO arXiv](https://arxiv.org/pdf/1807.09828)
- 2025 XR tracking study: up to 101% error increase in featureless environments, 2.8x device-to-device variation — [arXiv 2508.08642](https://arxiv.org/abs/2508.08642)
- Developer report of ARKit world-tracking drift regression on LiDAR iPhones in iOS 26.4+ (anecdotal) — [Apple forums 827240](https://developer.apple.com/forums/thread/827240)
- hloc (Hierarchical-Localization): Apache-2.0, Python/PyTorch, 4.3k stars, last release v1.4 July 2023; SfM map building + retrieval + SuperPoint/LightGlue/LoFTR matching; no mobile support mentioned; GPU/Docker/Colab oriented — [cvg/Hierarchical-Localization](https://github.com/cvg/Hierarchical-Localization)
- ORB-SLAM3: GPL-3.0 (commercial licence by contacting authors), C++11, 9.2k stars, README V1.0 dated Dec 2021, Ubuntu 16.04/18.04 only, no mobile support — [UZ-SLAMLab/ORB_SLAM3](https://github.com/UZ-SLAMLab/ORB_SLAM3); another source: ORB-SLAM "is not optimized for mobile applications" — [arXiv 2605.18385](https://arxiv.org/pdf/2605.18385)
- AREA (2023) report evaluated four open-source VPS components incl. hloc for indoor enterprise AR — [AREA PDF](https://thearea.org/wp-content/uploads/2023/07/4-Open-Source-VPS-for-Indoor-Enterprise-AR-Use-Cases.pdf)
- 2025 TU Wien thesis: ORB-SLAM3 monocular tracking registered to a pre-existing reference point cloud on smartphones; "final accuracy is highly dependent on the characteristics of the SLAM session"; proprietary alternatives (Immersal, etc.) are closed and expensive — [TU Wien thesis](https://www.cg.tuwien.ac.at/research/publications/2025/miklautsch_florian-baa/miklautsch_florian-baa-thesis.pdf)
- 2025 paper compares ARCore with Immersal, MultiSet and Lightship VPS (benchmark numbers not in snippet) — [CAMES 2025](https://cames.ippt.gov.pl/index.php/cames/article/download/1966/929/5385)
- VI-SLAM2tag (2022): uses phone VI-SLAM to auto-label fingerprint datasets, lowering survey effort — [arXiv 2207.02668](https://arxiv.org/pdf/2207.02668)

### Inferences
- Cheapest high-value use of vision for Atlas: use ARKit/ARCore pose deltas (via Expo/React Native AR bridging or a native module) as the PDR motion model when the user holds the phone up — it is far lower drift than step counting over 50–100 m, and needs zero infrastructure. Camera-up is also the natural posture for AR wayfinding.
- A self-hosted hloc server (Apache-2.0) fed by venue scans is the open route to absolute VPS fixes (QR/landmark alternative is cheaper), but it is a backend GPU service plus a mapping campaign — months of work, and malls change decor seasonally.
- VI-SLAM-tagged surveys (VI-SLAM2tag idea) are the practical way to collect Wi-Fi/BLE/magnetic fingerprints for a mall quickly.

### Gaps
- No 2025–26 open-source mobile SDK that does on-device relocalisation against an hloc/COLMAP map was found.
- No published mall-scale accuracy numbers for Immersal/Niantic-type VPS from independent sources.

---

## Key Question 6: Magnetic field fingerprinting (IndoorAtlas-style) — open implementations

### Takeaway
Magnetic fingerprinting is genuinely zero-infrastructure and is used by commercial vendors and competition winners as a fusion layer, but IndoorAtlas itself now quotes 2–5 m typical accuracy, cross-device offsets are a known problem, and no maintained open-source smartphone library was found — only research code, patents and datasets.

### Cited Findings
- IndoorAtlas support (Mar 2022): typical tracking accuracy 2–5 m, depending on magnetic data, Wi-Fi/BLE environment and fingerprinting effort — [IndoorAtlas support](https://support.indooratlas.com/support/solutions/articles/36000035912-what-is-the-positioning-accuracy-of-indooratlas-); earlier press (2012/2016, dated) claimed 0.1–2 m — [MIT Tech Review 2012](https://www.technologyreview.com/2012/07/16/115582/startup-uses-a-smartphone-compass-to-track-people-indoors/)
- Principle: steel structures, power systems and appliances perturb the geomagnetic field into a stable location profile — [PMC7699907](https://pmc.ncbi.nlm.nih.gov/articles/PMC7699907)
- Magil (HKUST, EWSN17/ToSN19): geomagnetic localisation without a pedometer; device readings differ but "the gaps between their readings remain rather stable" (cross-device calibration needed); no public code link found — [Magil ToSN19](https://home.cse.ust.hk/~gchan/papers/ToSN19_magil.pdf)
- MagWi: fuses magnetic + Wi-Fi on Android (no code found) — [MagWi record](https://vufind-test.katalog.k.utb.cz/SummonRecord/FETCH-LOGICAL-i203t-64e5c601056f54e130f5f84e5efae91b44b2cd36cc964b3cca4105c00e6813723)
- A 2018 paper found magnetic floor identification outperformed barometric and Wi-Fi approaches in its tests — [PMC6603673](https://pmc.ncbi.nlm.nih.gov/articles/PMC6603673)
- Granted US patents cover crowd-sourced magnetic fingerprinting with neural-network retraining (US11435189, US11428533, US11473915) — [Google Patents US11428533](https://patents.google.com/patent/US11428533)
- Open code found: odontoceti (magnetic localisation hobby project, date/licence unknown) — [odontoceti](https://github.com/nativ18/odontoceti); GitHub "geomagnetic" topic lists an Android fingerprint-map app — [GitHub topic](https://github.com/topics/geomagnetic?l=java)
- Open dataset: UCI Geo-Magnetic field + WLAN dataset (wristband + smartphone, 2016/17) — [UCI 377](https://archive.ics.uci.edu/dataset/377/geo+magnetic+field+and+wlan+dataset+for+indoor+localisation)
- Microsoft Indoor Location Competition 2.0 data includes geomagnetic traces from ~200 malls — [MSR dataset](https://www.microsoft.com/en-us/research/?p=766744)
- IPIN 2025 Track 6 team (Wuhan Univ./Transsion) uses Wi-Fi/BLE/magnetic fingerprinting with scenario recognition — [IPIN 2025 competitors](https://evaal.isti.cnr.it/2025/competitors)

### Inferences
- Magnetic data is best used in Atlas as an additional likelihood term in the particle filter along corridor edges (1-D magnetic profile per edge, matched by DTW/sequence matching), not as a stand-alone positioner. It is especially useful for disambiguating parallel corridors and detecting elevators/escalators.
- Patent landscape (Apple-owned patents from the search) is a commercial risk only for crowd-sourced NN-retraining designs; basic sequence matching of surveyed profiles is long-published prior art.

### Gaps
- No maintained (2023+) open-source library for smartphone magnetic fingerprinting was found.
- No independent 2024–26 mall benchmark of magnetic-only accuracy.

---

## Key Question 7: Sensor-fusion frameworks and open-source platforms

### Takeaway
The only actively maintained, TypeScript-native fusion framework is OpenHPS (Apache-2.0, with React Native add-on). FIND3 (Go, MIT) and Anyplace (Scala/Kotlin, MIT) are usable Wi-Fi/BLE fingerprinting backends but have older tooling; Navigine's "open source" is partial (routing/trilateration algorithms), its SDKs are proprietary binaries; IndoorLocation.io (Mapwize) offers MIT provider abstractions for iOS/Android.

### Cited Findings (project table)
- OpenHPS core — Apache-2.0; TypeScript 5.9+; 35 stars; 1,770 commits; copyright 2019–2026 (active); runs in Node, browser, workers, embedded (lite), and hybrid mobile via add-ons for React Native, NativeScript, Cordova, Capacitor; @openhps/fingerprinting add-on; trilateration/triangulation/fingerprinting/dead-reckoning nodes; no particle filter mentioned on the page — [OpenHPS/openhps-core](https://github.com/OpenHPS/openhps-core); JOSS 2025 paper describes it as a modular graph-based framework — [OpenHPS docs](https://openhps.org/docs/introduction/); [arXiv 2101.05198](https://arxiv.org/abs/2101.05198)
- FIND3 — MIT; Go (go.mod/main.go); 4.8k stars; 604 commits; 69 open issues; Wi-Fi + Bluetooth (+ magnetic mentioned); Android scanner app (also on F-Droid), CLI scanner, ESP8266/32 code, Docker server; self-described "stable and ready for use"; no recent release date visible — [schollz/find3](https://github.com/schollz/find3); [F-Droid FIND3 Scanner](https://f-droid.org/packages/com.internalpositioning.find3.find3app/)
- Anyplace (Univ. of Cyprus DMSL) — MIT; server Scala, core + Android libs Kotlin; 752 stars; 1,086 commits; Android clients active, iOS and Windows Phone clients deprecated; web Architect/Viewer; no numeric accuracy claims on page — [dmsl/anyplace](https://github.com/dmsl/anyplace)
- Navigine — Android SDK on Maven Central listed as "Proprietary"; repos ship demo app + .aar/iOS headers; open-source parts are algorithm pieces (trilateration first, Indoor Routing Library released Mar 2024); Flutter SDK repo exists — [Maven Central](https://central.sonatype.com/artifact/com.navigine/sdk); [Navigine open source](https://navigine.com/open-source/); [Navigine blog Mar 2024](https://navigine.com/blog/navigine-unveils-innovative-open-source-library-for-indoor-navigation/); [Navigine/geometry](https://github.com/Navigine/geometry)
- IndoorLocation.io (Mapwize/Cisco) — MIT (iOS repo); provider abstraction emitting lat/lon/floor; BasicBeaconIndoorLocationProvider for iOS and Android; Meraki provider via Node.js server — [IndoorLocation/indoor-location-ios](https://github.com/IndoorLocation/indoor-location-ios); [Cisco DevNet](https://developer.cisco.com/codeexchange/github/repo/IndoorLocation/meraki-indoor-location)
- EvaalScore / StepLogger — the IPIN competition's scoring software suite is published (SoftwareX 2025) — [SoftwareX via CNR](https://iris.cnr.it/bitstream/20.500.14243/540041/3/1-s2.0-S2352711025000822-main.pdf)
- Android platform sample for UWB ranging (Apache-2.0 platform-samples repo) — [android/platform-samples UwbRanging](https://github.com/android/platform-samples/tree/main/samples/connectivity/UwbRanging)
- Particle filter remains the dominant fusion architecture across IPIN 2025 entries (THWS & cronn CONDENSATION; CUMT-HC CNN-5G + PDR particle filter); EKF/UKF used where UWB gives ranges — [IPIN 2025 competitors](https://evaal.isti.cnr.it/2025/competitors)
- Situm/Pointr: no open-source code found; Situm support describes a probabilistic engine — [Situm support](https://situm.freshdesk.com/support/solutions/articles/35000084827)
- Estimote iOS Indoor SDK exists on GitHub (vendor, beacon-dependent) — [Estimote iOS-Indoor-SDK](https://WWW.GITHUB.COM/Estimote/iOS-Indoor-SDK)

### Inferences
- OpenHPS is the closest fit to a TypeScript/React Native codebase and could host Atlas's PDR + fingerprinting graph, but with 35 stars and essentially one academic maintainer it is a dependency risk; borrowing its node/graph design patterns may be wiser than depending on it.
- FIND3 and Anyplace are useful as reference implementations for Wi-Fi/BLE fingerprint storage and kNN/ML matching on the Kotlin backend, and Anyplace's Kotlin Android lib is directly readable for a Kotlin team.
- "indoorLoc" from the brief did not resolve to a specific project in searches; the UJIIndoorLoc Wi-Fi dataset (Torres-Sospedra, IPIN Track 3 chair) is the likely referent.

### Gaps
- Last-commit dates for OpenHPS, FIND3, Anyplace were not visible to the fetch tool; verify on GitHub before adopting.
- No open-source particle-filter + corridor-graph map-matching library specific to React Native was found.

---

## Key Question 8: Benchmarks and datasets — achievable median error in malls

### Takeaway
The best public mall-scale evidence (Microsoft Indoor Location Competition 2.0, 2021) shows ~1.5 m mean error only with offline post-processing of Wi-Fi + magnetic + iBeacon + waypoints; realistic online smartphone systems land at 2–5 m, and IPIN ranks on the 75th percentile with a 15 m floor penalty and a 20 m eligibility cutoff, which signals that sub-5 m online accuracy in large venues is still hard in 2025–26.

### Cited Findings
- IPIN Track 1 (onsite smartphone, large public venue): scored on third quartile of point error; +15 m per floor error; teams with Q3 > 20 m ineligible — [IPIN 2025 Track 1 annex](https://evaal.isti.cnr.it/fileadmin/2025/IPIN2025_-_track_1_technical_annex.pdf); IPIN 2026 (Rome, 5–8 Oct 2026) keeps the same track — [IPIN 2026 Track 1 annex](https://competition.ipin-conference.org/fileadmin/assets/Current_Competition/IPIN2026_Track1_TechnicalAnnex_v1.0.pdf)
- IPIN 2025 ran offsite 8–10 Sept and onsite in Tampere 13–14 Sept 2025; Track 3 data on Zenodo — [IPIN 2025 call](https://evaal.isti.cnr.it/2025/call-for-competition); [Zenodo 17087348](https://zenodo.org/doi/10.5281/zenodo.17087348); IPIN 2024 dataset on IEEE DataPort — [IEEE DataPort](https://ieee-dataport.org/node/13756)
- xDR Challenge 2025 (Track 5, smartphone + robot, AIST) results slides exist with circular error, heading error, and error accumulation gradient metrics — [xDR 2025 results PDF](https://unit.aist.go.jp/rihsa/xDR-Challenge-2025/xDR_Challenge_2025_files/20250918_xdrx2025_results_announcement_nomovie.pdf)
- Microsoft Indoor Location Competition 2.0 (2021): 1,170 teams, 28,009 submissions, 204 buildings; top team 1.50 m mean error (offline) — [HIT record of Hu et al. MobiCom 2023](https://scholar.hit.edu.cn/en/publications/the-wisdom-of-1170-teams-lessons-and-experiences-from-a-large-ind/); dataset: Wi-Fi, geomagnetic, iBeacon, waypoints from Chinese malls — [MSR dataset](https://www.microsoft.com/en-us/research/?p=766744)
- Original Microsoft Indoor Localization Competition (IPSN 2014–2018; dated) lessons paper — [MSR 2014](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/lymberopoulos_MC2R_2014.pdf); 2024 follow-up on realistic evaluation — [arXiv 2404.19538](https://bohrium.dp.tech/paper/arxiv/2404.19538)
- RoNIN dataset: Tango + Android app captures, ~50% withheld — [Sachini/ronin](https://github.com/Sachini/ronin); TLIO dataset: IMU + processed VIO ground truth, cc-by-nc — [CathIAS/TLIO](https://github.com/CathIAS/TLIO)
- ADVIO (2018; dated): authentic phone VIO dataset incl. shopping mall with ARKit/ARCore/Tango reference tracks — [ADVIO](https://arxiv.org/pdf/1807.09828)
- Hilti SLAM Challenge 2023 (construction sites; handheld + robot rigs, lidar + cameras + IMU; RA-L paper) — not smartphone-relevant beyond SLAM baselines; 2022 top teams reached ~2 cm on easy sequences — [arXiv 2404.09765](https://arxiv.org/abs/2404.09765); [Hilti-Oxford arXiv 2208.09825](https://arxiv.org/abs/2208.09825v3)
- Wi-Fi RTT enterprise WLAN (Sept 2026): median 1.21 m / p90 2.68 m, static points — [arXiv 2609.13795](https://arxiv.org/abs/2609.13795)
- UCI Geo-Magnetic + WLAN indoor dataset (2016/17) — [UCI 377](https://archive.ics.uci.edu/dataset/377/geo+magnetic+field+and+wlan+dataset+for+indoor+localisation)

### Inferences
- A realistic 2026 target for a zero/low-infrastructure mall app (PDR + corridor map matching + opportunistic Wi-Fi/BLE/magnetic): 3–5 m median, with floor correctness >90%. Reaching ~1–2 m online needs either dense BLE (1/30 m²), Wi-Fi RTT on enterprise APs (Android only), or UWB anchors.
- Atlas should adopt the IPIN metric set (Q3 error, floor penalty) for its own synthetic-to-real evaluation so results are comparable with the literature.

### Gaps
- Official IPIN 2024 and 2025 Track 1/3 per-team error values were not located (results pages not indexed by search at research time).
- Median (not mean) error for the Microsoft 2.0 winner, and mall-only subsets, not found.

---

## Key Question 9: Floor detection — barometer + transition detection best practice

### Takeaway
Best practice is relative, not absolute: detect pressure-change events (rate well above drift) and classify the conveyance (stairs/escalator/elevator) with accelerometer/magnetometer features, then snap to the nearest floor using the venue's floor heights and re-anchor the pressure baseline from any absolute fix (BLE/Wi-Fi) — absolute barometric altitude alone is unreliable because floor heights (2.5–6 m) sit inside sensor error and HVAC/door pressure transients.

### Cited Findings
- Microsoft Research (HotMobile 2014; dated but foundational): floor heights of 2.5–6.0 m "may be well within the range of measurement error" of phone barometers; elevators, escalators and stairs are separable by pressure-change rate, which sits well above drift — [MSR HotMobile14](https://microsoft.com/en-us/research/wp-content/uploads/2016/02/hotmobile14b.pdf)
- Floor determination needs better than 3 m height accuracy; multiple reference barometers avoid assuming known floor heights (2015; dated) — [PMC4431287](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4431287/)
- FloorPair pressure-pair method claims near-100% floor localisation across building types (2019) — [PMC6720727](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6720727/)
- 2019 study: >85% correct floor across three phone models, 94.2% on Huawei Mate 10 Pro — [DOAJ 2019](https://doaj.org/article/6ebd8331ae044757a707e739add3d7e6)
- Barometric drift makes long-term accuracy hard; hybrid barometer + other sensors advocated — [Glasgow eprints](https://eprints.gla.ac.uk/296817/1/296817.pdf)
- Viterbi-based fusion of accelerometer + barometer + Wi-Fi to detect stairs/elevator and estimate floor (Sensors 2021) — [PMC8271586](https://pmc.ncbi.nlm.nih.gov/articles/PMC8271586)
- Accelerometer alone struggles to separate stairs-up/down/walking; barometer features do much better — [BME7 study](https://eprints.uet.vnu.edu.vn/eprints/id/eprint/2945/1/BME7_Full_text_in_PDF_53.pdf)
- ELESON (arXiv 2024, rev. July 2025): deep learning on phone inertial + magnetic data classifies elevator / escalator / neither without assuming pedestrian behaviour; magnetic signature of enclosed elevator differs from semi-open escalator — [arXiv 2405.03218](https://arxiv.org/pdf/2405.03218)
- Falcon & Schulzrinne (2017/18; dated): 91% floor-level accuracy using barometer plus clustering of repeated visits to learn floor height — [arXiv 1710.11122](https://arxiv.org/pdf/1710.11122v1)
- 2026 pilot (50 elevator rides): HVAC, elevator shafts and pressurisation degrade barometers indoors; accelerometer-only elevator altitude MAE 0.48 floors (small study) — [NHSJS 2026](https://nhsjs.com/2026/machine-learning-altitude-estimation-from-smartphone-accelerometer-elevator-data/)
- Magnetic floor identification outperformed barometric and Wi-Fi in one 2018 study — [PMC6603673](https://pmc.ncbi.nlm.nih.gov/articles/PMC6603673)
- IPIN penalises floor errors at 15 m each, so floor correctness dominates scores — [IPIN 2025 Track 1 annex](https://evaal.isti.cnr.it/fileadmin/2025/IPIN2025_-_track_1_technical_annex.pdf)
- IPIN_CUMT (2025) uses a dual-branch CNN floor classifier on radio fingerprints alongside barometer — [IPIN 2025 competitors](https://evaal.isti.cnr.it/2025/competitors)

### Inferences
- For Atlas: keep barometer as a change detector (delta-P over 5–15 s windows with hysteresis), gate transitions to the corridor graph's known vertical connectors (escalator/elevator/stair nodes), classify conveyance type from accel variance + magnetic anomaly, and reset the per-floor pressure baseline whenever a BLE/Wi-Fi fix confirms the floor. This needs no infrastructure beyond knowing floor heights.
- Malls are hard cases: open atria mean BLE/Wi-Fi fingerprints bleed across floors, so vertical-connector gating is more valuable than in office buildings.

### Gaps
- No 2024–26 mall-specific escalator/atrium floor-detection benchmark found.
- iOS CMAltimeter vs Android pressure-sensor comparative accuracy for 2024+ phones not found.

---

## Cross-cutting summary table (for the report writer)

| Technique | Infrastructure by app owner | Platform | Realistic accuracy (2026) | Open source |
|---|---|---|---|---|
| PDR + corridor map matching (particle filter) | None | Both | 3–5 m median standalone over short walks; drifts without absolute fixes | RoNIN (GPL-3, Py), TLIO (Py), OpenHPS (Apache-2, TS) |
| Phone VIO (ARKit/ARCore) as motion model | None | Both | ~0.02 m/s drift (2022 bench); fails in featureless areas | n/a (platform SDKs) |
| Wi-Fi RSSI fingerprinting | None (survey needed) | Android only; 4 scans/2 min | 2–5 m | FIND3 (MIT, Go), Anyplace (MIT, Scala/Kotlin) |
| Wi-Fi RTT 802.11mc/az | None only if venue WLAN is Cisco/Aruba FTM-capable | Android 9+/15+ only | ~1.2 m median, 2.7 m p90 (2026 study) | Android API; no third-party lib needed |
| BLE RSSI trilateration/fingerprint | ~7–33 beacons per 1,000 m² | Both | 2–5 m (sparse) to ~1–2.5 m (dense) | FIND3, Anyplace, OpenHPS, IndoorLocation.io (MIT) |
| BLE AoA | Antenna-array locators | None native on phones | n/a | none viable |
| BLE Channel Sounding | BT 6.3 anchors | iPhone 17 (iOS 27); Android 16 API 36 | tens of cm (vendor) | none found |
| UWB | ~10–16 anchors per 1,000 m² | Flagship Android (Jetpack), iPhone 11+ (NI) | ~10–30 cm ranging | Android sample only; anchors proprietary |
| Magnetic fingerprinting | None (survey needed) | Both | 2–5 m (IndoorAtlas quote) | no maintained lib; datasets only |
| Open VPS (hloc) | Venue scan + GPU server | Both (via camera) | sub-m when localised (vendor-class claim) | hloc (Apache-2, Py), ORB-SLAM3 (GPL-3, C++) |
| Barometer floor detection | None (needs floor heights) | Both | 85–94% floor accuracy (2019); best as change detector | none specific |
